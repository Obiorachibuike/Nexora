use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DurabilityPolicy {
    Fsync,
    EverySec,
    None,
}

impl Default for DurabilityPolicy {
    fn default() -> Self {
        DurabilityPolicy::EverySec
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub data_dir: PathBuf,
    pub max_segment_size_bytes: u64,
    pub durability: DurabilityPolicy,
    pub auto_compaction: bool,
}

impl Default for StorageConfig {
    fn default() -> Self {
        Self {
            data_dir: PathBuf::from("./data"),
            max_segment_size_bytes: 64 * 1024 * 1024, // 64 MB
            durability: DurabilityPolicy::EverySec,
            auto_compaction: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub bind_addr: String,
    pub tcp_port: u16,
    pub http_port: u16,
    pub max_connections: usize,
    pub max_frame_size: usize,
    pub api_key: Option<String>,
    pub storage: StorageConfig,
    pub worker_lease_ttl_ms: u64,
    pub heartbeat_interval_ms: u64,
    pub default_retry_limit: u32,
}

impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            bind_addr: "127.0.0.1".to_string(),
            tcp_port: 6380,
            http_port: 6381,
            max_connections: 1000,
            max_frame_size: 16 * 1024 * 1024, // 16 MB
            api_key: None,
            storage: StorageConfig::default(),
            worker_lease_ttl_ms: 30000,
            heartbeat_interval_ms: 5000,
            default_retry_limit: 3,
        }
    }
}
