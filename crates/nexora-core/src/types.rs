use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct JobId(pub String);

impl JobId {
    pub fn new() -> Self {
        Self(uuid::Uuid::now_v7().to_string())
    }
}

impl Default for JobId {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Display for JobId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[repr(u8)]
pub enum JobPriority {
    Low = 1,
    Normal = 5,
    High = 10,
    Critical = 20,
}

impl Default for JobPriority {
    fn default() -> Self {
        JobPriority::Normal
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum JobState {
    Waiting,
    Delayed,
    Active,
    Completed,
    Failed,
    Cancelled,
    DeadLettered,
}

impl JobState {
    pub fn is_terminal(&self) -> bool {
        matches!(self, JobState::Completed | JobState::Cancelled | JobState::DeadLettered)
    }

    pub fn can_transition_to(&self, target: JobState) -> bool {
        match (self, target) {
            (JobState::Waiting, JobState::Active) => true,
            (JobState::Waiting, JobState::Cancelled) => true,
            (JobState::Delayed, JobState::Waiting) => true,
            (JobState::Delayed, JobState::Cancelled) => true,
            (JobState::Active, JobState::Completed) => true,
            (JobState::Active, JobState::Failed) => true,
            (JobState::Active, JobState::Waiting) => true, // Retry or requeue
            (JobState::Active, JobState::DeadLettered) => true,
            (JobState::Failed, JobState::Waiting) => true, // Manual retry
            _ => false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobRecord {
    pub id: JobId,
    pub queue: String,
    pub name: String,
    pub payload: serde_json::Value,
    pub state: JobState,
    pub priority: JobPriority,
    pub attempts: u32,
    pub max_attempts: u32,
    pub backoff_ms: u64,
    pub created_at: DateTime<Utc>,
    pub run_at: DateTime<Utc>,
    pub lease_owner: Option<String>,
    pub lease_expires_at: Option<DateTime<Utc>>,
    pub fencing_token: u64,
    pub completed_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
    pub deduplication_key: Option<String>,
}
