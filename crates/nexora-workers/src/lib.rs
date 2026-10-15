use chrono::{DateTime, Duration, Utc};
use nexora_core::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerInfo {
    pub worker_id: String,
    pub hostname: String,
    pub queues: Vec<String>,
    pub concurrency: usize,
    pub registered_at: DateTime<Utc>,
    pub last_heartbeat_at: DateTime<Utc>,
}

pub struct WorkerRegistry {
    workers: Arc<RwLock<HashMap<String, WorkerInfo>>>,
    heartbeat_timeout_ms: u64,
}

impl WorkerRegistry {
    pub fn new(heartbeat_timeout_ms: u64) -> Self {
        Self {
            workers: Arc::new(RwLock::new(HashMap::new())),
            heartbeat_timeout_ms,
        }
    }

    pub async fn register(
        &self,
        worker_id: String,
        hostname: String,
        queues: Vec<String>,
        concurrency: usize,
    ) -> Result<()> {
        let now = Utc::now();
        let info = WorkerInfo {
            worker_id: worker_id.clone(),
            hostname,
            queues,
            concurrency,
            registered_at: now,
            last_heartbeat_at: now,
        };
        let mut map = self.workers.write().await;
        map.insert(worker_id, info);
        Ok(())
    }

    pub async fn heartbeat(&self, worker_id: &str) -> Result<bool> {
        let mut map = self.workers.write().await;
        if let Some(w) = map.get_mut(worker_id) {
            w.last_heartbeat_at = Utc::now();
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn prune_stale_workers(&self) -> Result<Vec<String>> {
        let cutoff = Utc::now() - Duration::milliseconds(self.heartbeat_timeout_ms as i64);
        let mut map = self.workers.write().await;
        let mut stale = Vec::new();
        map.retain(|id, info| {
            if info.last_heartbeat_at < cutoff {
                stale.push(id.clone());
                false
            } else {
                true
            }
        });
        Ok(stale)
    }

    pub async fn list(&self) -> Result<Vec<WorkerInfo>> {
        let map = self.workers.read().await;
        Ok(map.values().cloned().collect())
    }
}
