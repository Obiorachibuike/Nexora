use chrono::{DateTime, Duration, Utc};
use nexora_core::{NexoraError, Result};
use nexora_storage::AofEngine;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MisfirePolicy {
    Skip,
    FireOnce,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleDefinition {
    pub id: String,
    pub name: String,
    pub queue: String,
    pub interval_ms: u64,
    pub payload: serde_json::Value,
    pub misfire_policy: MisfirePolicy,
    pub next_run_at: DateTime<Utc>,
    pub last_run_at: Option<DateTime<Utc>>,
    pub is_paused: bool,
}

pub struct NexoraScheduler {
    storage: Arc<AofEngine>,
    schedules: Arc<RwLock<HashMap<String, ScheduleDefinition>>>,
}

impl NexoraScheduler {
    pub fn new(storage: Arc<AofEngine>) -> Self {
        Self {
            storage,
            schedules: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn add_interval_schedule(
        &self,
        name: &str,
        queue: &str,
        interval_ms: u64,
        payload: serde_json::Value,
        misfire_policy: MisfirePolicy,
    ) -> Result<ScheduleDefinition> {
        let id = uuid::Uuid::now_v7().to_string();
        let next_run_at = Utc::now() + Duration::milliseconds(interval_ms as i64);

        let def = ScheduleDefinition {
            id: id.clone(),
            name: name.to_string(),
            queue: queue.to_string(),
            interval_ms,
            payload,
            misfire_policy,
            next_run_at,
            last_run_at: None,
            is_paused: false,
        };

        // Persist to storage
        let key = format!("schedule:{}", id).into_bytes();
        let val = serde_json::to_vec(&def)?;
        self.storage.set(key, val, None).await?;

        let mut scheds = self.schedules.write().await;
        scheds.insert(id, def.clone());

        Ok(def)
    }

    pub async fn list_schedules(&self) -> Result<Vec<ScheduleDefinition>> {
        let scheds = self.schedules.read().await;
        Ok(scheds.values().cloned().collect())
    }

    pub async fn cancel_schedule(&self, id: &str) -> Result<bool> {
        let mut scheds = self.schedules.write().await;
        if scheds.remove(id).is_some() {
            let key = format!("schedule:{}", id).into_bytes();
            self.storage.delete(&key).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}
