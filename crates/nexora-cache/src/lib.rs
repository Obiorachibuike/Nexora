use chrono::Utc;
use nexora_core::Result;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone)]
struct CacheEntry {
    value: Vec<u8>,
    expires_at_ms: u64,
    last_accessed_ms: u64,
}

#[derive(Clone)]
pub struct NexoraCache {
    entries: Arc<RwLock<HashMap<Vec<u8>, CacheEntry>>>,
    max_items: usize,
}

impl NexoraCache {
    pub fn new(max_items: usize) -> Self {
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
            max_items,
        }
    }

    pub async fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let mut map = self.entries.write().await;
        if let Some(entry) = map.get_mut(key) {
            if entry.expires_at_ms != 0 && entry.expires_at_ms <= now_ms {
                map.remove(key);
                return Ok(None);
            }
            entry.last_accessed_ms = now_ms;
            return Ok(Some(entry.value.clone()));
        }
        Ok(None)
    }

    pub async fn set(&self, key: Vec<u8>, value: Vec<u8>, ttl_ms: Option<u64>) -> Result<()> {
        let now_ms = Utc::now().timestamp_millis() as u64;
        let expires_at_ms = ttl_ms.map(|t| now_ms + t).unwrap_or(0);
        let mut map = self.entries.write().await;

        if map.len() >= self.max_items && !map.contains_key(&key) {
            // Evict oldest accessed item (LRU)
            if let Some(oldest_key) = map
                .iter()
                .min_by_key(|(_, entry)| entry.last_accessed_ms)
                .map(|(k, _)| k.clone())
            {
                map.remove(&oldest_key);
            }
        }

        map.insert(
            key,
            CacheEntry {
                value,
                expires_at_ms,
                last_accessed_ms: now_ms,
            },
        );
        Ok(())
    }

    pub async fn delete(&self, key: &[u8]) -> Result<bool> {
        let mut map = self.entries.write().await;
        Ok(map.remove(key).is_some())
    }

    pub async fn exists(&self, key: &[u8]) -> Result<bool> {
        Ok(self.get(key).await?.is_some())
    }
}
