import { NexoraClient } from './client';
import { CommandId } from './protocol';
import { Job, JobOptions, JobHandler, ProcessOptions } from './types';

export class NexoraQueue {
  constructor(private client: NexoraClient, public readonly name: string) {}

  async add<T = any>(jobName: string, payload: T, options: JobOptions = {}): Promise<Job<T>> {
    const resp = await this.client.sendCommand(CommandId.QueueAdd, {
      queue: this.name,
      name: jobName,
      payload,
      delay_ms: options.delayMs,
      priority: options.priority,
      max_attempts: options.maxAttempts,
      dedup_key: options.deduplicationKey,
    });
    return resp.job;
  }

  async fetchNext<T = any>(workerId: string, leaseMs: number = 30000): Promise<Job<T> | null> {
    const resp = await this.client.sendCommand(CommandId.QueueFetch, {
      queue: this.name,
      worker_id: workerId,
      lease_ms: leaseMs,
    });
    return resp.job || null;
  }

  async ack(jobId: string, workerId: string, fencingToken: string): Promise<void> {
    await this.client.sendCommand(CommandId.QueueAck, {
      job_id: jobId,
      worker_id: workerId,
      fencing_token: fencingToken,
    });
  }

  async fail(jobId: string, workerId: string, fencingToken: string, error: string): Promise<void> {
    await this.client.sendCommand(CommandId.QueueFail, {
      job_id: jobId,
      worker_id: workerId,
      fencing_token: fencingToken,
      error,
    });
  }

  async inspect<T = any>(jobId: string): Promise<Job<T> | null> {
    const resp = await this.client.sendCommand(CommandId.QueueInspect, {
      job_id: jobId,
    });
    return resp.job || null;
  }

  async process<T = any>(
    jobName: string,
    handler: JobHandler<T>,
    options: ProcessOptions = {}
  ): Promise<{ stop: () => void }> {
    const workerId = `worker-${Math.random().toString(36).slice(2, 9)}`;
    const leaseMs = options.leaseMs || 30000;
    let running = true;

    const pollLoop = async () => {
      while (running) {
        try {
          const job = await this.fetchNext<T>(workerId, leaseMs);
          if (job && (!jobName || job.name === jobName)) {
            try {
              await handler(job);
              await this.ack(job.id, workerId, job.fencingToken);
            } catch (err: any) {
              await this.fail(job.id, workerId, job.fencingToken, err.message || String(err));
            }
          } else {
            // Idle wait
            await new Promise((r) => setTimeout(r, 200));
          }
        } catch (e) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    };

    pollLoop();

    return {
      stop: () => {
        running = false;
      },
    };
  }
}
