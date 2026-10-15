use chrono::{DateTime, Duration, Utc};
use nexora_core::{JobId, JobPriority, JobRecord, JobState, NexoraError, Result};
use nexora_storage::AofEngine;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

pub struct QueueEngine {
    storage: Arc<AofEngine>,
    jobs: Arc<RwLock<HashMap<JobId, JobRecord>>>,
    queue_indices: Arc<RwLock<HashMap<String, Vec<JobId>>>>,
    fencing_counter: AtomicU64,
}

impl QueueEngine {
    pub fn new(storage: Arc<AofEngine>) -> Self {
        Self {
            storage,
            jobs: Arc::new(RwLock::new(HashMap::new())),
            queue_indices: Arc::new(RwLock::new(HashMap::new())),
            fencing_counter: AtomicU64::new(1),
        }
    }

    pub async fn add_job(
        &self,
        queue: &str,
        name: &str,
        payload: serde_json::Value,
        priority: JobPriority,
        delay_ms: Option<u64>,
        max_attempts: u32,
        dedup_key: Option<String>,
    ) -> Result<JobRecord> {
        let now = Utc::now();
        let run_at = match delay_ms {
            Some(d) if d > 0 => now + Duration::milliseconds(d as i64),
            _ => now,
        };

        let initial_state = if run_at > now {
            JobState::Delayed
        } else {
            JobState::Waiting
        };

        let id = JobId::new();
        let job = JobRecord {
            id: id.clone(),
            queue: queue.to_string(),
            name: name.to_string(),
            payload,
            state: initial_state,
            priority,
            attempts: 0,
            max_attempts: if max_attempts == 0 { 3 } else { max_attempts },
            backoff_ms: 1000,
            created_at: now,
            run_at,
            lease_owner: None,
            lease_expires_at: None,
            fencing_token: 0,
            completed_at: None,
            last_error: None,
            deduplication_key: dedup_key,
        };

        // Persist to storage
        let key = format!("job:{}", id.0).into_bytes();
        let val = serde_json::to_vec(&job)?;
        self.storage.set(key, val, None).await?;

        // Update in-memory index
        {
            let mut jobs = self.jobs.write().await;
            jobs.insert(id.clone(), job.clone());
        }
        {
            let mut q_idx = self.queue_indices.write().await;
            q_idx.entry(queue.to_string()).or_default().push(id);
        }

        Ok(job)
    }

    pub async fn fetch_next_job(
        &self,
        queue: &str,
        worker_id: &str,
        lease_duration_ms: u64,
    ) -> Result<Option<JobRecord>> {
        let now = Utc::now();
        let mut jobs = self.jobs.write().await;
        let q_idx = self.queue_indices.read().await;

        let queue_jobs = match q_idx.get(queue) {
            Some(list) => list,
            None => return Ok(None),
        };

        // Find candidate job: Waiting or expired Active lease, ordered by Priority then creation time
        let mut best_id: Option<JobId> = None;
        let mut best_priority = JobPriority::Low;
        let mut best_created_at = now;

        for id in queue_jobs {
            if let Some(job) = jobs.get(id) {
                let is_eligible = match job.state {
                    JobState::Waiting => job.run_at <= now,
                    JobState::Delayed => job.run_at <= now,
                    JobState::Active => {
                        // Check if lease expired (abandoned worker)
                        match job.lease_expires_at {
                            Some(exp) => exp <= now,
                            None => true,
                        }
                    }
                    _ => false,
                };

                if is_eligible {
                    let is_better = best_id.is_none()
                        || job.priority > best_priority
                        || (job.priority == best_priority && job.created_at < best_created_at);

                    if is_better {
                        best_id = Some(id.clone());
                        best_priority = job.priority;
                        best_created_at = job.created_at;
                    }
                }
            }
        }

        if let Some(target_id) = best_id {
            if let Some(job) = jobs.get_mut(&target_id) {
                let fencing_token = self.fencing_counter.fetch_add(1, Ordering::SeqCst);
                let lease_exp = now + Duration::milliseconds(lease_duration_ms as i64);

                job.state = JobState::Active;
                job.attempts += 1;
                job.lease_owner = Some(worker_id.to_string());
                job.lease_expires_at = Some(lease_exp);
                job.fencing_token = fencing_token;

                // Persist updated state
                let key = format!("job:{}", job.id.0).into_bytes();
                let val = serde_json::to_vec(&job)?;
                self.storage.set(key, val, None).await?;

                return Ok(Some(job.clone()));
            }
        }

        Ok(None)
    }

    pub async fn ack_job(&self, job_id: &JobId, worker_id: &str, fencing_token: u64) -> Result<()> {
        let mut jobs = self.jobs.write().await;
        let job = jobs.get_mut(job_id).ok_or_else(|| NexoraError::NotFound("Job not found".into()))?;

        if job.lease_owner.as_deref() != Some(worker_id) || job.fencing_token != fencing_token {
            return Err(NexoraError::LeaseExpired { worker_id: worker_id.to_string() });
        }

        job.state = JobState::Completed;
        job.completed_at = Some(Utc::now());
        job.lease_owner = None;
        job.lease_expires_at = None;

        let key = format!("job:{}", job.id.0).into_bytes();
        let val = serde_json::to_vec(&job)?;
        self.storage.set(key, val, None).await?;

        Ok(())
    }

    pub async fn fail_job(
        &self,
        job_id: &JobId,
        worker_id: &str,
        fencing_token: u64,
        error_msg: &str,
    ) -> Result<()> {
        let mut jobs = self.jobs.write().await;
        let job = jobs.get_mut(job_id).ok_or_else(|| NexoraError::NotFound("Job not found".into()))?;

        if job.lease_owner.as_deref() != Some(worker_id) || job.fencing_token != fencing_token {
            return Err(NexoraError::LeaseExpired { worker_id: worker_id.to_string() });
        }

        job.last_error = Some(error_msg.to_string());
        job.lease_owner = None;
        job.lease_expires_at = None;

        if job.attempts >= job.max_attempts {
            job.state = JobState::DeadLettered;
            warn!("Job {} reached maximum attempts ({}), moved to DeadLettered", job.id.0, job.max_attempts);
        } else {
            // Exponential backoff
            let delay_multiplier = 2u64.pow(job.attempts.saturating_sub(1));
            let delay_ms = job.backoff_ms * delay_multiplier;
            job.state = JobState::Delayed;
            job.run_at = Utc::now() + Duration::milliseconds(delay_ms as i64);
            info!("Job {} failed, scheduling retry attempt {} in {} ms", job.id.0, job.attempts + 1, delay_ms);
        }

        let key = format!("job:{}", job.id.0).into_bytes();
        let val = serde_json::to_vec(&job)?;
        self.storage.set(key, val, None).await?;

        Ok(())
    }

    pub async fn inspect_job(&self, job_id: &JobId) -> Result<Option<JobRecord>> {
        let jobs = self.jobs.read().await;
        Ok(jobs.get(job_id).cloned())
    }
}
