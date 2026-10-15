import * as net from 'net';
import { NexoraClientOptions } from './types';
import { NexoraStore } from './store';
import { NexoraQueue } from './queue';
import { NexoraEvents } from './events';
import { NexoraScheduler } from './scheduler';
import {
  HEADER_LEN,
  CommandId,
  StatusCode,
  MessageType,
  encodeFrame,
  decodeHeader,
} from './protocol';
import {
  NexoraError,
  AuthenticationError,
  NotFoundError,
  LeaseExpiredError,
  ConnectionError,
} from './errors';

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (err: any) => void;
  timer: NodeJS.Timeout;
}

export class NexoraClient {
  private host: string;
  private port: number;
  private apiKey?: string;
  private timeoutMs: number;
  private socket: net.Socket | null = null;
  private correlationId: bigint = 1n;
  private pending = new Map<bigint, PendingRequest>();
  private rxBuffer = Buffer.alloc(0);
  private connected: boolean = false;

  constructor(options: NexoraClientOptions = {}) {
    this.host = options.host || '127.0.0.1';
    this.port = options.port || 6380;
    this.apiKey = options.apiKey;
    this.timeoutMs = options.timeoutMs || 5000;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      this.socket = net.createConnection({ host: this.host, port: this.port }, async () => {
        this.connected = true;
        this.setupSocketHandlers();

        if (this.apiKey) {
          try {
            await this.authenticate(this.apiKey);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else {
          resolve();
        }
      });

      this.socket.once('error', (err) => {
        reject(new ConnectionError(`Could not connect to ${this.host}:${this.port} - ${err.message}`));
      });
    });
  }

  private setupSocketHandlers() {
    if (!this.socket) return;

    this.socket.on('data', (chunk: Buffer | string) => {
      const bufChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      this.rxBuffer = Buffer.concat([this.rxBuffer, bufChunk]);

      while (this.rxBuffer.length >= HEADER_LEN) {
        let header;
        try {
          header = decodeHeader(this.rxBuffer.subarray(0, HEADER_LEN));
          if (!header) break;
        } catch (e: any) {
          console.error('[NexoraClient] Header parse failure:', e);
          this.rxBuffer = Buffer.alloc(0);
          break;
        }

        const totalLen = HEADER_LEN + header.payloadLen;
        if (this.rxBuffer.length < totalLen) {
          break; // Need more data
        }

        const payloadBuf = this.rxBuffer.subarray(HEADER_LEN, totalLen);
        this.rxBuffer = this.rxBuffer.subarray(totalLen);

        const pendingReq = this.pending.get(header.correlationId);
        if (pendingReq) {
          clearTimeout(pendingReq.timer);
          this.pending.delete(header.correlationId);

          let parsedPayload: any = null;
          if (payloadBuf.length > 0) {
            try {
              parsedPayload = JSON.parse(payloadBuf.toString('utf-8'));
            } catch (e) {
              parsedPayload = payloadBuf.toString('utf-8');
            }
          }

          if (header.commandOrStatus === StatusCode.Ok || header.commandOrStatus === StatusCode.Created) {
            pendingReq.resolve(parsedPayload);
          } else if (header.commandOrStatus === StatusCode.NotFound) {
            pendingReq.reject(new NotFoundError(parsedPayload?.error || 'Not found'));
          } else if (header.commandOrStatus === StatusCode.Unauthorized) {
            pendingReq.reject(new AuthenticationError(parsedPayload?.error || 'Unauthorized'));
          } else if (header.commandOrStatus === StatusCode.LeaseExpired) {
            pendingReq.reject(new LeaseExpiredError(parsedPayload?.error || 'Lease expired'));
          } else {
            pendingReq.reject(new NexoraError(parsedPayload?.error || `Error status ${header.commandOrStatus}`));
          }
        }
      }
    });

    this.socket.on('close', () => {
      this.connected = false;
      for (const [_, pending] of this.pending.entries()) {
        clearTimeout(pending.timer);
        pending.reject(new ConnectionError('Connection closed'));
      }
      this.pending.clear();
    });
  }

  async authenticate(apiKey: string): Promise<void> {
    await this.sendCommand(CommandId.Auth, { api_key: apiKey });
  }

  async ping(): Promise<boolean> {
    const resp = await this.sendCommand(CommandId.Ping, {});
    return Boolean(resp.pong);
  }

  async sendCommand(commandId: number, payload: any): Promise<any> {
    if (!this.connected || !this.socket) {
      await this.connect();
    }

    const cid = this.correlationId++;
    const payloadBuf = Buffer.from(JSON.stringify(payload));
    const frame = encodeFrame(MessageType.Request, commandId, cid, payloadBuf);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(cid);
        reject(new NexoraError(`Request timed out after ${this.timeoutMs}ms`, 'TIMEOUT'));
      }, this.timeoutMs);

      this.pending.set(cid, { resolve, reject, timer });
      this.socket!.write(frame);
    });
  }

  store(): NexoraStore {
    return new NexoraStore(this);
  }

  queue(name: string = 'default'): NexoraQueue {
    return new NexoraQueue(this, name);
  }

  events(): NexoraEvents {
    return new NexoraEvents(this);
  }

  scheduler(): NexoraScheduler {
    return new NexoraScheduler(this);
  }

  async close(): Promise<void> {
    if (this.socket) {
      this.socket.end();
      this.socket.destroy();
      this.socket = null;
    }
    this.connected = false;
  }
}
