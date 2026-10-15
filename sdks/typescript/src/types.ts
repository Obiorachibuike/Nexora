export interface NexoraClientOptions {
  host?: string;
  port?: number;
  apiKey?: string;
  timeoutMs?: number;
}

export interface SetOptions {
  ttlMs?: number;
}

export interface JobOptions {
  priority?: number;
  delayMs?: number;
  maxAttempts?: number;
  backoffMs?: number;
  deduplicationKey?: string;
}

export interface Job<T = any> {
  id: string;
  queue: string;
  name: string;
  payload: T;
  state: 'waiting' | 'delayed' | 'active' | 'completed' | 'failed' | 'cancelled' | 'dead_lettered';
  priority: number;
  attempts: number;
  maxAttempts: number;
  fencingToken: string;
  createdAt: number;
  runAt: number;
}

export interface ProcessOptions {
  concurrency?: number;
  leaseMs?: number;
}

export type JobHandler<T = any> = (job: Job<T>) => Promise<void>;
