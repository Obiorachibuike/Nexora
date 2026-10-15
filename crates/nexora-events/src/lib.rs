use chrono::{DateTime, Utc};
use nexora_core::Result;
use nexora_storage::AofEngine;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventRecord {
    pub id: u64,
    pub topic: String,
    pub payload: serde_json::Value,
    pub timestamp: DateTime<Utc>,
}

pub struct EventBroker {
    storage: Arc<AofEngine>,
    topics: Arc<RwLock<HashMap<String, Vec<EventRecord>>>>,
    consumer_offsets: Arc<RwLock<HashMap<(String, String), u64>>>, // (topic, consumer_group) -> acked_offset
    counter: AtomicU64,
}

impl EventBroker {
    pub fn new(storage: Arc<AofEngine>) -> Self {
        Self {
            storage,
            topics: Arc::new(RwLock::new(HashMap::new())),
            consumer_offsets: Arc::new(RwLock::new(HashMap::new())),
            counter: AtomicU64::new(1),
        }
    }

    pub async fn publish(&self, topic: &str, payload: serde_json::Value) -> Result<u64> {
        let id = self.counter.fetch_add(1, Ordering::SeqCst);
        let event = EventRecord {
            id,
            topic: topic.to_string(),
            payload,
            timestamp: Utc::now(),
        };

        // Persist to storage
        let key = format!("event:{}:{:012}", topic, id).into_bytes();
        let val = serde_json::to_vec(&event)?;
        self.storage.set(key, val, None).await?;

        // Update in-memory topic list
        let mut topics = self.topics.write().await;
        topics.entry(topic.to_string()).or_default().push(event);

        Ok(id)
    }

    pub async fn ack(&self, topic: &str, group: &str, event_id: u64) -> Result<()> {
        let mut offsets = self.consumer_offsets.write().await;
        offsets.insert((topic.to_string(), group.to_string()), event_id);
        Ok(())
    }

    pub async fn poll(&self, topic: &str, group: &str, batch_size: usize) -> Result<Vec<EventRecord>> {
        let offsets = self.consumer_offsets.read().await;
        let last_ack = offsets.get(&(topic.to_string(), group.to_string())).copied().unwrap_or(0);

        let topics = self.topics.read().await;
        if let Some(list) = topics.get(topic) {
            let pending: Vec<EventRecord> = list
                .iter()
                .filter(|ev| ev.id > last_ack)
                .take(batch_size)
                .cloned()
                .collect();
            Ok(pending)
        } else {
            Ok(vec![])
        }
    }
}
