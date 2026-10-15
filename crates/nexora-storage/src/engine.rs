use crate::record::*;
use crate::segment::SegmentFile;
use chrono::Utc;
use nexora_core::{DurabilityPolicy, NexoraError, Result, StorageConfig};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

#[derive(Debug, Clone)]
pub struct ValueMeta {
    pub value: Vec<u8>,
    pub expires_at_ms: u64,
    pub seq: u64,
}

pub struct AofEngine {
    config: StorageConfig,
    active_segment: Arc<RwLock<SegmentFile>>,
    index: Arc<RwLock<HashMap<Vec<u8>, ValueMeta>>>,
    next_seq: AtomicU64,
}

impl AofEngine {
    pub fn open(config: StorageConfig) -> Result<Self> {
        std::fs::create_dir_all(&config.data_dir)?;
        let mut active_segment = SegmentFile::open_or_create(&config.data_dir, 1)?;

        let mut index = HashMap::new();
        let (records, _) = active_segment.scan_and_recover()?;
        let now_ms = Utc::now().timestamp_millis() as u64;
        let mut max_seq = 0u64;

        for (rec, _) in records {
            if rec.seq > max_seq {
                max_seq = rec.seq;
            }
            match rec.record_type {
                RecordType::Set => {
                    if rec.expires_at_ms == 0 || rec.expires_at_ms > now_ms {
                        index.insert(
                            rec.key,
                            ValueMeta {
                                value: rec.value,
                                expires_at_ms: rec.expires_at_ms,
                                seq: rec.seq,
                            },
                        );
                    }
                }
                RecordType::Delete => {
                    index.remove(&rec.key);
                }
                RecordType::Expire => {
                    if let Some(entry) = index.get_mut(&rec.key) {
                        entry.expires_at_ms = rec.expires_at_ms;
                        if entry.expires_at_ms != 0 && entry.expires_at_ms <= now_ms {
                            index.remove(&rec.key);
                        }
                    }
                }
                _ => {}
            }
        }

        info!("Storage engine recovered {} active keys, last seq: {}", index.len(), max_seq);

        Ok(Self {
            config,
            active_segment: Arc::new(RwLock::new(active_segment)),
            index: Arc::new(RwLock::new(index)),
            next_seq: AtomicU64::new(max_seq + 1),
        })
    }

    pub async fn set(&self, key: Vec<u8>, value: Vec<u8>, ttl_ms: Option<u64>) -> Result<u64> {
        let seq = self.next_seq.fetch_add(1, Ordering::SeqCst);
        let now_ms = Utc::now().timestamp_millis() as u64;
        let expires_at_ms = ttl_ms.map(|ttl| now_ms + ttl).unwrap_or(0);

        let record = StorageRecord {
            record_type: RecordType::Set,
            seq,
            timestamp_ms: now_ms,
            expires_at_ms,
            key: key.clone(),
            value: value.clone(),
        };

        let encoded = record.encode();
        {
            let mut seg = self.active_segment.write().await;
            seg.append(&encoded, self.config.durability)?;
        }

        {
            let mut idx = self.index.write().await;
            idx.insert(
                key,
                ValueMeta {
                    value,
                    expires_at_ms,
                    seq,
                },
            );
        }

        Ok(seq)
    }

    pub async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let idx = self.index.read().await;

        if let Some(meta) = idx.get(key) {
            if meta.expires_at_ms != 0 && meta.expires_at_ms <= now_ms {
                return Ok(None);
            }
            return Ok(Some(meta.value.clone()));
        }

        Ok(None)
    }

    pub async fn delete(&self, key: &[u8]) -> Result<bool> {
        let mut idx = self.index.write().await;
        if idx.remove(key).is_some() {
            let seq = self.next_seq.fetch_add(1, Ordering::SeqCst);
            let now_ms = Utc::now().timestamp_millis() as u64;
            let record = StorageRecord {
                record_type: RecordType::Delete,
                seq,
                timestamp_ms: now_ms,
                expires_at_ms: 0,
                key: key.to_vec(),
                value: vec![],
            };
            let encoded = record.encode();
            let mut seg = self.active_segment.write().await;
            seg.append(&encoded, self.config.durability)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn exists(&self, key: &[u8]) -> Result<bool> {
        let val = self.get(key).await?;
        Ok(val.is_some())
    }

    pub async fn expire(&self, key: &[u8], ttl_ms: u64) -> Result<bool> {
        let mut idx = self.index.write().await;
        let now_ms = Utc::now().timestamp_millis() as u64;
        if let Some(meta) = idx.get_mut(key) {
            if meta.expires_at_ms != 0 && meta.expires_at_ms <= now_ms {
                return Ok(false);
            }
            meta.expires_at_ms = now_ms + ttl_ms;
            let seq = self.next_seq.fetch_add(1, Ordering::SeqCst);
            let record = StorageRecord {
                record_type: RecordType::Expire,
                seq,
                timestamp_ms: now_ms,
                expires_at_ms: meta.expires_at_ms,
                key: key.to_vec(),
                value: vec![],
            };
            let encoded = record.encode();
            let mut seg = self.active_segment.write().await;
            seg.append(&encoded, self.config.durability)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn ttl(&self, key: &[u8]) -> Result<Option<i64>> {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let idx = self.index.read().await;
        if let Some(meta) = idx.get(key) {
            if meta.expires_at_ms == 0 {
                return Ok(Some(-1)); // Persisted without TTL
            }
            if meta.expires_at_ms <= now_ms {
                return Ok(None);
            }
            return Ok(Some((meta.expires_at_ms - now_ms) as i64));
        }
        Ok(None)
    }

    pub async fn set_nx(&self, key: Vec<u8>, value: Vec<u8>, ttl_ms: Option<u64>) -> Result<bool> {
        if self.exists(&key).await? {
            return Ok(false);
        }
        self.set(key, value, ttl_ms).await?;
        Ok(true)
    }

    pub async fn cas(&self, key: &[u8], expected_val: &[u8], new_val: Vec<u8>, ttl_ms: Option<u64>) -> Result<bool> {
        let current = self.get(key).await?;
        if current.as_deref() == Some(expected_val) {
            self.set(key.to_vec(), new_val, ttl_ms).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn incr(&self, key: &[u8], delta: i64) -> Result<i64> {
        let current_bytes = self.get(key).await?;
        let current_num: i64 = match current_bytes {
            Some(b) => String::from_utf8_lossy(&b).trim().parse().unwrap_or(0),
            None => 0,
        };
        let new_num = current_num + delta;
        self.set(key.to_vec(), new_num.to_string().into_bytes(), None).await?;
        Ok(new_num)
    }

    pub async fn keys(&self, prefix: Option<&[u8]>) -> Result<Vec<Vec<u8>>> {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let idx = self.index.read().await;
        let mut result = Vec::new();
        for (k, meta) in idx.iter() {
            if meta.expires_at_ms != 0 && meta.expires_at_ms <= now_ms {
                continue;
            }
            if let Some(p) = prefix {
                if k.starts_with(p) {
                    result.push(k.clone());
                }
            } else {
                result.push(k.clone());
            }
        }
        Ok(result)
    }
}
