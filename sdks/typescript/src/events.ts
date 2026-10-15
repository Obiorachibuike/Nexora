import { NexoraClient } from './client';
import { CommandId } from './protocol';

export interface EventRecord<T = any> {
  id: number;
  topic: string;
  payload: T;
  timestamp: number;
}

export class NexoraEvents {
  constructor(private client: NexoraClient) {}

  async publish<T = any>(topic: string, payload: T): Promise<EventRecord<T>> {
    const resp = await this.client.sendCommand(CommandId.EventPublish, {
      topic,
      payload,
    });
    return resp.event;
  }

  async poll<T = any>(topic: string, group: string, batchSize: number = 10): Promise<EventRecord<T>[]> {
    const resp = await this.client.sendCommand(CommandId.EventSubscribe, {
      topic,
      group,
      batch_size: batchSize,
    });
    return resp.events || [];
  }

  async ack(topic: string, group: string, eventId: number): Promise<void> {
    await this.client.sendCommand(CommandId.EventAck, {
      topic,
      group,
      event_id: eventId,
    });
  }
}
