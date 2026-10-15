use nexora_protocol::*;
use nexora_storage::AofEngine;
use std::sync::Arc;

pub struct TestHarness {
    pub engine: Arc<AofEngine>,
}

impl TestHarness {
    pub fn new_temp() -> Self {
        let temp_dir = std::env::temp_dir().join(format!("nexora_test_{}", uuid::Uuid::new_v4()));
        let mut config = nexora_core::StorageConfig::default();
        config.data_dir = temp_dir;
        let engine = Arc::new(AofEngine::open(config).expect("Failed to initialize test engine"));
        Self { engine }
    }
}
