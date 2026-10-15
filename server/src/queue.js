const crypto = require('crypto');

const JobState = {
  Waiting: 'waiting',
  Delayed: 'delayed',
  Active: 'active',
  Completed: 'completed',
  Failed: 'failed',
  Cancelled: 'cancelled',
  DeadLettered: 'dead_lettered',
};

const JobPriority = {
  Low: 1,
  Normal: 5,
  High: 10,
  Critical: 20,
};

class QueueEngine {
  constructor(storage) {
    this.storage = storage;
    this.jobs = new Map(); // id -> job object
    this.queues = new Map(); // queueName -> Set of jobIds
    this.fencingCounter = 1n;
  }

  async init() {
    // Scan storage for existing jobs
    const keys = await this.storage.keys('job:');
    for (const key of keys) {
      const data = await this.storage.get(key);
      if (data) {
        try {
          const job = JSON.parse(data.toString('utf-8'));
          this.jobs.set(job.id, job);
          if (!this.queues.has(job.queue)) {
            this.queues.set(job.queue, new Set());
          }
          this.queues.get(job.queue).add(job.id);
        } catch (e) {}
      }
    }
  }

  async addJob(queueName, name, payload, options = {}) {
    const id = crypto.randomUUID();
    const now = Date.now();
    const delayMs = options.delayMs || 0;
    const runAt = now + delayMs;
    const priority = options.priority || JobPriority.Normal;
    const maxAttempts = options.maxAttempts || 3;
    const backoffMs = options.backoffMs || 1000;

    const job = {
      id,
      queue: queueName,
      name,
      payload,
      state: delayMs > 0 ? JobState.Delayed : JobState.Waiting,
      priority,
      attempts: 0,
      maxAttempts,
      backoffMs,
      createdAt: now,
      runAt,
      leaseOwner: null,
      leaseExpiresAt: null,
      fencingToken: '0',
      completedAt: null,
      lastError: null,
      deduplicationKey: options.deduplicationKey || null,
    };

    // Store in persistence
    await this.storage.set(`job:${id}`, JSON.stringify(job));

    this.jobs.set(id, job);
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, new Set());
    }
    this.queues.get(queueName).add(id);

    return job;
  }

  async fetchNextJob(queueName, workerId, leaseDurationMs = 30000) {
    const now = Date.now();
    const jobIds = this.queues.get(queueName);
    if (!jobIds || jobIds.size === 0) return null;

    let candidate = null;

    for (const id of jobIds) {
      const job = this.jobs.get(id);
      if (!job) continue;

      let isEligible = false;
      if (job.state === JobState.Waiting && job.runAt <= now) {
        isEligible = true;
      } else if (job.state === JobState.Delayed && job.runAt <= now) {
        isEligible = true;
      } else if (job.state === JobState.Active && job.leaseExpiresAt && job.leaseExpiresAt <= now) {
        // Abandoned worker lease expired!
        isEligible = true;
      }

      if (isEligible) {
        if (!candidate) {
          candidate = job;
        } else {
          // Compare priority then createdAt
          if (job.priority > candidate.priority) {
            candidate = job;
          } else if (job.priority === candidate.priority && job.createdAt < candidate.createdAt) {
            candidate = job;
          }
        }
      }
    }

    if (candidate) {
      const fencingToken = String(this.fencingCounter++);
      candidate.state = JobState.Active;
      candidate.attempts += 1;
      candidate.leaseOwner = workerId;
      candidate.leaseExpiresAt = now + leaseDurationMs;
      candidate.fencingToken = fencingToken;

      await this.storage.set(`job:${candidate.id}`, JSON.stringify(candidate));
      return { ...candidate };
    }

    return null;
  }

  async ackJob(jobId, workerId, fencingToken) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    if (job.leaseOwner !== workerId || job.fencingToken !== String(fencingToken)) {
      throw new Error('Lease expired or invalid fencing token');
    }

    job.state = JobState.Completed;
    job.completedAt = Date.now();
    job.leaseOwner = null;
    job.leaseExpiresAt = null;

    await this.storage.set(`job:${jobId}`, JSON.stringify(job));
    return true;
  }

  async failJob(jobId, workerId, fencingToken, errorMsg) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Job not found');

    if (job.leaseOwner !== workerId || job.fencingToken !== String(fencingToken)) {
      throw new Error('Lease expired or invalid fencing token');
    }

    job.lastError = errorMsg;
    job.leaseOwner = null;
    job.leaseExpiresAt = null;

    if (job.attempts >= job.maxAttempts) {
      job.state = JobState.DeadLettered;
    } else {
      const delayMultiplier = Math.pow(2, Math.max(0, job.attempts - 1));
      const delayMs = job.backoffMs * delayMultiplier;
      job.state = JobState.Delayed;
      job.runAt = Date.now() + delayMs;
    }

    await this.storage.set(`job:${jobId}`, JSON.stringify(job));
    return job;
  }

  async inspectJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async listQueues() {
    const result = [];
    for (const [name, jobIds] of this.queues.entries()) {
      let waiting = 0;
      let active = 0;
      let completed = 0;
      let failed = 0;
      let delayed = 0;
      let deadLettered = 0;

      for (const id of jobIds) {
        const j = this.jobs.get(id);
        if (!j) continue;
        if (j.state === JobState.Waiting) waiting++;
        else if (j.state === JobState.Active) active++;
        else if (j.state === JobState.Completed) completed++;
        else if (j.state === JobState.Failed) failed++;
        else if (j.state === JobState.Delayed) delayed++;
        else if (j.state === JobState.DeadLettered) deadLettered++;
      }

      result.push({
        queue: name,
        totalJobs: jobIds.size,
        waiting,
        active,
        completed,
        failed,
        delayed,
        deadLettered,
      });
    }
    return result;
  }
}

module.exports = {
  QueueEngine,
  JobState,
  JobPriority,
};
