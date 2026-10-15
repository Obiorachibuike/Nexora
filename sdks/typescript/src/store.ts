import { NexoraClient } from './client';
import { CommandId, StatusCode } from './protocol';
import { SetOptions } from './types';
import { NotFoundError } from './errors';

export class NexoraStore {
  constructor(private client: NexoraClient) {}

  async set(key: string, value: any, options: SetOptions = {}): Promise<void> {
    await this.client.sendCommand(CommandId.Set, {
      key,
      value,
      ttl_ms: options.ttlMs,
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const resp = await this.client.sendCommand(CommandId.Get, { key });
      return resp.value as T;
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        return null;
      }
      throw e;
    }
  }

  async delete(key: string): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.Del, { key });
    return Boolean(resp.deleted);
  }

  async exists(key: string): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.Exists, { key });
    return Boolean(resp.exists);
  }

  async expire(key: string, ttlMs: number): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.Expire, { key, ttl_ms: ttlMs });
    return Boolean(resp.updated);
  }

  async ttl(key: string): Promise<number | null> {
    try {
      const resp = await this.client.sendCommand(CommandId.Ttl, { key });
      return resp.ttl_ms;
    } catch (e: any) {
      if (e instanceof NotFoundError) {
        return null;
      }
      throw e;
    }
  }

  async setNx(key: string, value: any, options: SetOptions = {}): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.SetNx, {
      key,
      value,
      ttl_ms: options.ttlMs,
    });
    return Boolean(resp.success);
  }

  async cas(key: string, expected: any, value: any, options: SetOptions = {}): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.Cas, {
      key,
      expected,
      value,
      ttl_ms: options.ttlMs,
    });
    return Boolean(resp.success);
  }

  async incr(key: string, delta: number = 1): Promise<number> {
    const resp = await this.client.sendCommand(CommandId.Incr, { key, delta });
    return Number(resp.value);
  }

  async keys(prefix?: string): Promise<string[]> {
    const resp = await this.client.sendCommand(CommandId.Keys, { prefix });
    return resp.keys || [];
  }
}
