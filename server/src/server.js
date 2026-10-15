const net = require('net');
const http = require('http');
const { AofEngine } = require('./storage');
const { QueueEngine } = require('./queue');
const { AuthManager } = require('./auth');
const {
  HEADER_LEN,
  CommandId,
  StatusCode,
  MessageType,
  encodeFrame,
  decodeHeader,
} = require('./protocol');

class NexoraServer {
  constructor(options = {}) {
    this.bindAddr = options.bindAddr || '127.0.0.1';
    this.tcpPort = options.tcpPort || 6380;
    this.httpPort = options.httpPort || 6381;
    this.apiKey = options.apiKey || null;
    this.dataDir = options.dataDir || './data';
    this.durability = options.durability || 'everysec';

    this.storage = new AofEngine({
      dataDir: this.dataDir,
      durability: this.durability,
    });
    this.queue = new QueueEngine(this.storage);
    this.auth = new AuthManager(this.apiKey);

    // Event Messaging System
    this.events = new Map(); // topic -> Array<{ id: number, topic: string, payload: any, timestamp: number }>
    this.consumerOffsets = new Map(); // "topic:group" -> number (lastAckedId)
    this.eventCounter = 1;

    // Scheduler System
    this.schedules = new Map(); // id -> schedule object
    this.schedulerTimer = null;

    this.tcpServer = null;
    this.httpServer = null;

    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      activeConnections: 0,
    };
  }

  async start() {
    await this.storage.init();
    await this.queue.init();

    // Recover schedules from storage
    const scheduleKeys = await this.storage.keys('schedule:');
    for (const k of scheduleKeys) {
      const data = await this.storage.get(k);
      if (data) {
        try {
          const s = JSON.parse(data.toString('utf-8'));
          this.schedules.set(s.id, s);
        } catch (e) {}
      }
    }

    // Start background scheduler tick loop
    this.schedulerTimer = setInterval(async () => {
      const now = Date.now();
      for (const [id, sch] of this.schedules.entries()) {
        if (!sch.isPaused && sch.nextRunAt <= now) {
          // Trigger job into destination queue
          await this.queue.addJob(sch.queue, sch.name, sch.payload, { priority: 10 });
          sch.lastRunAt = now;
          sch.nextRunAt = now + sch.intervalMs;
          await this.storage.set(`schedule:${id}`, JSON.stringify(sch));
        }
      }
    }, 200);

    // Start TCP Server
    await new Promise((resolve, reject) => {
      this.tcpServer = net.createServer((socket) => this._handleSocket(socket));
      this.tcpServer.on('error', reject);
      this.tcpServer.listen(this.tcpPort, this.bindAddr, () => {
        console.info(`[Nexora] Binary TCP Server listening on ${this.bindAddr}:${this.tcpPort}`);
        resolve();
      });
    });

    // Start HTTP Management API
    await new Promise((resolve, reject) => {
      this.httpServer = http.createServer((req, res) => this._handleHttp(req, res));
      this.httpServer.on('error', reject);
      this.httpServer.listen(this.httpPort, this.bindAddr, () => {
        console.info(`[Nexora] HTTP Management API listening on ${this.bindAddr}:${this.httpPort}`);
        resolve();
      });
    });
  }

  _handleSocket(socket) {
    this.metrics.activeConnections++;
    let authenticated = !this.auth.isAuthRequired();
    let rxBuffer = Buffer.alloc(0);

    socket.on('data', async (chunk) => {
      rxBuffer = Buffer.concat([rxBuffer, chunk]);

      while (rxBuffer.length >= HEADER_LEN) {
        let header;
        try {
          header = decodeHeader(rxBuffer.subarray(0, HEADER_LEN));
        } catch (err) {
          this.metrics.totalErrors++;
          const errResp = encodeFrame(MessageType.Response, StatusCode.BadRequest, 0n, Buffer.from(err.message));
          socket.write(errResp);
          rxBuffer = Buffer.alloc(0);
          break;
        }

        const totalExpected = HEADER_LEN + header.payloadLen;
        if (rxBuffer.length < totalExpected) {
          // Waiting for full payload
          break;
        }

        const payloadBuf = rxBuffer.subarray(HEADER_LEN, totalExpected);
        rxBuffer = rxBuffer.subarray(totalExpected);

        this.metrics.totalRequests++;

        // Auth enforcement
        if (!authenticated && header.commandOrStatus !== CommandId.Auth) {
          const authErr = encodeFrame(
            MessageType.Response,
            StatusCode.Unauthorized,
            header.correlationId,
            Buffer.from(JSON.stringify({ error: 'Authentication required' }))
          );
          socket.write(authErr);
          continue;
        }

        // Process Command
        try {
          const resp = await this._dispatchCommand(header, payloadBuf, () => {
            authenticated = true;
          });
          socket.write(resp);
        } catch (e) {
          this.metrics.totalErrors++;
          const serverErr = encodeFrame(
            MessageType.Response,
            StatusCode.ServerError,
            header.correlationId,
            Buffer.from(JSON.stringify({ error: e.message }))
          );
          socket.write(serverErr);
        }
      }
    });

    socket.on('close', () => {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
    });

    socket.on('error', (err) => {
      this.metrics.totalErrors++;
    });
  }

  async _dispatchCommand(header, payloadBuf, setAuthenticated) {
    const cmd = header.commandOrStatus;
    const cid = header.correlationId;

    let payloadJson = {};
    if (payloadBuf.length > 0) {
      try {
        payloadJson = JSON.parse(payloadBuf.toString('utf-8'));
      } catch (e) {}
    }

    switch (cmd) {
      case CommandId.Auth: {
        const key = payloadJson.api_key;
        if (this.auth.verifyKey(key)) {
          setAuthenticated();
          return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ status: 'ok' })));
        } else {
          return encodeFrame(MessageType.Response, StatusCode.Unauthorized, cid, Buffer.from(JSON.stringify({ error: 'Invalid API key' })));
        }
      }

      case CommandId.Ping: {
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ pong: true })));
      }

      case CommandId.Info: {
        return encodeFrame(
          MessageType.Response,
          StatusCode.Ok,
          cid,
          Buffer.from(JSON.stringify({
            server: 'Nexora',
            version: '0.1.0',
            protocol: 'NBP/1.0',
            storage: 'AofEngine',
            keys: this.storage.index.size,
          }))
        );
      }

      case CommandId.Set: {
        const { key, value, ttl_ms } = payloadJson;
        if (!key) {
          return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Key required' })));
        }
        const seq = await this.storage.set(key, value, ttl_ms);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ status: 'ok', seq: Number(seq) })));
      }

      case CommandId.Get: {
        const { key } = payloadJson;
        if (!key) {
          return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Key required' })));
        }
        const val = await this.storage.get(key);
        if (val === null) {
          return encodeFrame(MessageType.Response, StatusCode.NotFound, cid, Buffer.from(JSON.stringify({ error: 'Key not found' })));
        }
        let parsedVal;
        try {
          parsedVal = JSON.parse(val.toString('utf-8'));
        } catch (e) {
          parsedVal = val.toString('utf-8');
        }
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ key, value: parsedVal })));
      }

      case CommandId.Del: {
        const { key } = payloadJson;
        const deleted = await this.storage.delete(key);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ deleted })));
      }

      case CommandId.Exists: {
        const { key } = payloadJson;
        const exists = await this.storage.exists(key);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ exists })));
      }

      case CommandId.Expire: {
        const { key, ttl_ms } = payloadJson;
        const updated = await this.storage.expire(key, ttl_ms);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ updated })));
      }

      case CommandId.Ttl: {
        const { key } = payloadJson;
        const remaining = await this.storage.ttl(key);
        if (remaining === null) {
          return encodeFrame(MessageType.Response, StatusCode.NotFound, cid, Buffer.from(JSON.stringify({ error: 'Key not found' })));
        }
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ key, ttl_ms: remaining })));
      }

      case CommandId.SetNx: {
        const { key, value, ttl_ms } = payloadJson;
        const success = await this.storage.setNx(key, value, ttl_ms);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ success })));
      }

      case CommandId.Cas: {
        const { key, expected, value, ttl_ms } = payloadJson;
        const success = await this.storage.cas(key, expected, value, ttl_ms);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ success })));
      }

      case CommandId.Incr: {
        const { key, delta } = payloadJson;
        const newVal = await this.storage.incr(key, delta || 1);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ key, value: newVal })));
      }

      case CommandId.Keys: {
        const { prefix } = payloadJson;
        const keys = await this.storage.keys(prefix);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ keys })));
      }

      // Queue commands
      case CommandId.QueueAdd: {
        const { queue, name, payload, delay_ms, priority, max_attempts, dedup_key } = payloadJson;
        const job = await this.queue.addJob(queue || 'default', name || 'task', payload || {}, {
          delayMs: delay_ms,
          priority,
          maxAttempts: max_attempts,
          deduplicationKey: dedup_key,
        });
        return encodeFrame(MessageType.Response, StatusCode.Created, cid, Buffer.from(JSON.stringify({ job })));
      }

      case CommandId.QueueFetch: {
        const { queue, worker_id, lease_ms } = payloadJson;
        const job = await this.queue.fetchNextJob(queue || 'default', worker_id || 'worker-1', lease_ms || 30000);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ job })));
      }

      case CommandId.QueueAck: {
        const { job_id, worker_id, fencing_token } = payloadJson;
        await this.queue.ackJob(job_id, worker_id, fencing_token);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ status: 'ok' })));
      }

      case CommandId.QueueFail: {
        const { job_id, worker_id, fencing_token, error } = payloadJson;
        const updatedJob = await this.queue.failJob(job_id, worker_id, fencing_token, error);
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ job: updatedJob })));
      }

      case CommandId.QueueInspect: {
        const { job_id } = payloadJson;
        const job = await this.queue.inspectJob(job_id);
        if (!job) {
          return encodeFrame(MessageType.Response, StatusCode.NotFound, cid, Buffer.from(JSON.stringify({ error: 'Job not found' })));
        }
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ job })));
      }

      case CommandId.QueueList: {
        const queues = await this.queue.listQueues();
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ queues })));
      }

      // Event messaging commands
      case CommandId.EventPublish: {
        const { topic, payload } = payloadJson;
        if (!topic) {
          return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Topic required' })));
        }
        const eventId = this.eventCounter++;
        const event = {
          id: eventId,
          topic,
          payload: payload || {},
          timestamp: Date.now(),
        };

        if (!this.events.has(topic)) {
          this.events.set(topic, []);
        }
        this.events.get(topic).push(event);

        // Persist event
        await this.storage.set(`event:${topic}:${eventId}`, JSON.stringify(event));
        return encodeFrame(MessageType.Response, StatusCode.Created, cid, Buffer.from(JSON.stringify({ event })));
      }

      case CommandId.EventSubscribe: {
        const { topic, group, batch_size } = payloadJson;
        if (!topic || !group) {
          return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Topic and group required' })));
        }
        const key = `${topic}:${group}`;
        const lastAck = this.consumerOffsets.get(key) || 0;
        const topicEvents = this.events.get(topic) || [];
        const limit = batch_size || 10;
        const pending = topicEvents.filter(ev => ev.id > lastAck).slice(0, limit);

        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ events: pending })));
      }

      case CommandId.EventAck: {
        const { topic, group, event_id } = payloadJson;
        if (!topic || !group || event_id === undefined) {
          return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Topic, group, and event_id required' })));
        }
        const key = `${topic}:${group}`;
        this.consumerOffsets.set(key, Number(event_id));
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ status: 'ok' })));
      }

      // Scheduler commands
      case CommandId.ScheduleAdd: {
        const { name, queue, interval_ms, payload, misfire_policy } = payloadJson;
        const crypto = require('crypto');
        const id = crypto.randomUUID();
        const now = Date.now();
        const schedule = {
          id,
          name: name || 'recurring-task',
          queue: queue || 'default',
          intervalMs: interval_ms || 60000,
          payload: payload || {},
          misfirePolicy: misfire_policy || 'Skip',
          nextRunAt: now + (interval_ms || 60000),
          lastRunAt: null,
          isPaused: false,
        };

        this.schedules.set(id, schedule);
        await this.storage.set(`schedule:${id}`, JSON.stringify(schedule));
        return encodeFrame(MessageType.Response, StatusCode.Created, cid, Buffer.from(JSON.stringify({ schedule })));
      }

      case CommandId.ScheduleList: {
        const list = Array.from(this.schedules.values());
        return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ schedules: list })));
      }

      case CommandId.ScheduleCancel: {
        const { id } = payloadJson;
        if (this.schedules.has(id)) {
          this.schedules.delete(id);
          await this.storage.delete(`schedule:${id}`);
          return encodeFrame(MessageType.Response, StatusCode.Ok, cid, Buffer.from(JSON.stringify({ cancelled: true })));
        }
        return encodeFrame(MessageType.Response, StatusCode.NotFound, cid, Buffer.from(JSON.stringify({ error: 'Schedule not found' })));
      }

      default:
        return encodeFrame(MessageType.Response, StatusCode.BadRequest, cid, Buffer.from(JSON.stringify({ error: 'Unknown command' })));
    }
  }

  _handleHttp(req, res) {
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'healthy',
        engine: 'Nexora',
        version: '0.1.0',
        uptime: process.uptime(),
      }));
      return;
    }

    if (req.url === '/ready' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        ready: true,
        storage: 'online',
        connections: this.metrics.activeConnections,
      }));
      return;
    }

    if (req.url === '/metrics' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(this.metrics));
      return;
    }

    if (req.url === '/api/v1/stats' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({
        server: 'Nexora/0.1.0',
        protocol: 'NBP/1.0',
        keys: this.storage.index.size,
        metrics: this.metrics,
      }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  async close() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.tcpServer) {
      await new Promise((res) => this.tcpServer.close(res));
    }
    if (this.httpServer) {
      await new Promise((res) => this.httpServer.close(res));
    }
    await this.storage.close();
  }
}

module.exports = {
  NexoraServer,
};
