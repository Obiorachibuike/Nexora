export const MAGIC = Buffer.from('NEXO');
export const PROTOCOL_VERSION = 1;
export const HEADER_LEN = 24;

export const MessageType = {
  Request: 1,
  Response: 2,
  Ping: 3,
  Pong: 4,
} as const;

export const CommandId = {
  Auth: 0x0001,
  Ping: 0x0002,
  Info: 0x0003,

  Set: 0x0010,
  Get: 0x0011,
  Del: 0x0012,
  Exists: 0x0013,
  Expire: 0x0014,
  Ttl: 0x0015,
  SetNx: 0x0016,
  Cas: 0x0017,
  Incr: 0x0018,
  Decr: 0x0019,
  Keys: 0x001A,

  QueueAdd: 0x0020,
  QueueFetch: 0x0021,
  QueueAck: 0x0022,
  QueueFail: 0x0023,
  QueueInspect: 0x0024,
  QueueCancel: 0x0025,
  QueueRetry: 0x0026,
  QueueList: 0x0027,

  EventPublish: 0x0030,
  EventSubscribe: 0x0031,
  EventAck: 0x0032,

  ScheduleAdd: 0x0040,
  ScheduleList: 0x0041,
  ScheduleCancel: 0x0042,
} as const;

export const StatusCode = {
  Ok: 0x0000,
  Created: 0x0001,
  NotFound: 0x0002,
  Unauthorized: 0x0003,
  BadRequest: 0x0004,
  Conflict: 0x0005,
  ServerError: 0x0006,
  LeaseExpired: 0x0007,
  RateLimited: 0x0008,
  Timeout: 0x0009,
} as const;

export function crc16(buf: Buffer): number {
  let crc = 0xFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= (buf[i] << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc;
}

export function encodeFrame(
  messageType: number,
  commandOrStatus: number,
  correlationId: bigint,
  payloadBuf: Buffer = Buffer.alloc(0),
  flags: number = 0
): Buffer {
  const payloadLen = payloadBuf.length;
  const headerBuf = Buffer.alloc(HEADER_LEN);

  headerBuf.set(MAGIC, 0);
  headerBuf[4] = PROTOCOL_VERSION;
  headerBuf[5] = messageType;
  headerBuf.writeUInt16BE(flags, 6);
  headerBuf.writeBigUInt64BE(correlationId, 8);
  headerBuf.writeUInt16BE(commandOrStatus, 16);
  headerBuf.writeUInt32BE(payloadLen, 18);

  const checksum = crc16(headerBuf.subarray(0, 22));
  headerBuf.writeUInt16BE(checksum, 22);

  return Buffer.concat([headerBuf, payloadBuf]);
}

export function decodeHeader(buf: Buffer) {
  if (buf.length < HEADER_LEN) return null;
  if (!buf.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Invalid magic bytes');
  }
  const version = buf[4];
  if (version !== PROTOCOL_VERSION) {
    throw new Error(`Unsupported protocol version: ${version}`);
  }
  const messageType = buf[5];
  const flags = buf.readUInt16BE(6);
  const correlationId = buf.readBigUInt64BE(8);
  const commandOrStatus = buf.readUInt16BE(16);
  const payloadLen = buf.readUInt32BE(18);
  const expectedChecksum = buf.readUInt16BE(22);

  const calculatedChecksum = crc16(buf.subarray(0, 22));
  if (calculatedChecksum !== expectedChecksum) {
    throw new Error('Header checksum mismatch');
  }

  return {
    version,
    messageType,
    flags,
    correlationId,
    commandOrStatus,
    payloadLen,
  };
}
