use thiserror::Error;

#[derive(Error, Debug)]
pub enum NexoraError {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Protocol error: {0}")]
    Protocol(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("CRC mismatch: expected {expected:#010x}, calculated {calculated:#010x}")]
    CrcMismatch { expected: u32, calculated: u32 },

    #[error("Torn write detected at offset {offset}")]
    TornWrite { offset: u64 },

    #[error("Authentication failed: {0}")]
    Unauthorized(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Queue error: {0}")]
    Queue(String),

    #[error("Lease expired or invalid token for worker {worker_id}")]
    LeaseExpired { worker_id: String },

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

pub type Result<T> = std::result::Result<T, NexoraError>;
