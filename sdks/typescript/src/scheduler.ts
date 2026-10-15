import { NexoraClient } from './client';
import { CommandId } from './protocol';

export interface ScheduleDefinition<T = any> {
  id: string;
  name: string;
  queue: string;
  intervalMs: number;
  payload: T;
  misfirePolicy: 'Skip' | 'FireOnce';
  nextRunAt: number;
  lastRunAt: number | null;
  isPaused: boolean;
}

export class NexoraScheduler {
  constructor(private client: NexoraClient) {}

  async addIntervalSchedule<T = any>(
    name: string,
    queue: string,
    intervalMs: number,
    payload: T,
    misfirePolicy: 'Skip' | 'FireOnce' = 'Skip'
  ): Promise<ScheduleDefinition<T>> {
    const resp = await this.client.sendCommand(CommandId.ScheduleAdd, {
      name,
      queue,
      interval_ms: intervalMs,
      payload,
      misfire_policy: misfirePolicy,
    });
    return resp.schedule;
  }

  async listSchedules(): Promise<ScheduleDefinition[]> {
    const resp = await this.client.sendCommand(CommandId.ScheduleList, {});
    return resp.schedules || [];
  }

  async cancelSchedule(id: string): Promise<boolean> {
    const resp = await this.client.sendCommand(CommandId.ScheduleCancel, { id });
    return Boolean(resp.cancelled);
  }
}
