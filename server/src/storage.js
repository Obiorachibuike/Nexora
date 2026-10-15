const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RECORD_MAGIC = Buffer.from([0xAA, 0x55]);
const FIXED_RECORD_HEADER_LEN = 35; // 2 magic + 1 type + 8 seq + 8 ts + 8 exp + 4 klen + 4 vlen
const RECORD_CRC_LEN = 4;

const RecordType = {
  Set: 1,
  Delete: 2,
  Expire: 3,
  QueueJobCreate: 4,
  QueueJobUpdate: 5,
  Event: 6,
  Schedule: 7,
};

class AofEngine {
  constructor(options = {}) {
    this.dataDir = options.dataDir || path.resolve(process.cwd(), 'data');
    this.durability = options.durability || 'everysec'; // 'fsync' | 'everysec' | 'none'
    this.index = new Map(); // key -> { value: Buffer, expiresAtMs: number, seq: bigint }
    this.nextSeq = 1n;
    this.segmentFd = null;
    this.segmentPath = null;
    this.segmentSize = 0;
    this.syncInterval = null;
    this.dirty = false;
  }

  async init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.segmentPath = path.join(this.dataDir, 'segment_00000001.log');
    const exists = fs.existsSync(this.segmentPath);
    if (!exists) {
      fs.writeFileSync(this.segmentPath, Buffer.alloc(0));
    }

    // Recover existing segment
    await this._recover();

    // Open segment file descriptor for appending
    this.segmentFd = fs.openSync(this.segmentPath, 'r+');
    this.segmentSize = fs.fstatSync(this.segmentFd).size;

    if (this.durability === 'everysec') {
      this.syncInterval = setInterval(() => {
        if (this.dirty && this.segmentFd) {
          try {
            fs.fdatasyncSync(this.segmentFd);
            this.dirty = false;
          } catch (e) {
            console.error('[Storage] fdatasync error:', e);
          }
        }
      }, 1000);
    }
  }

  async _recover() {
    const data = fs.readFileSync(this.segmentPath);
    let offset = 0;
    let lastValidOffset = 0;
    const nowMs = Date.now();
    let recoveredCount = 0;

    while (offset < data.length) {
      const remainingLen = data.length - offset;
      if (remainingLen < FIXED_RECORD_HEADER_LEN + RECORD_CRC_LEN) {
        console.warn(`[Storage Recovery] Truncating torn write at offset ${offset} (${remainingLen} bytes remaining)`);
        break;
      }

      if (data[offset] !== 0xAA || data[offset + 1] !== 0x55) {
        console.warn(`[Storage Recovery] Invalid magic at offset ${offset}, truncating log tail`);
        break;
      }

      const recType = data[offset + 2];
      const seq = data.readBigUInt64BE(offset + 3);
      const timestampMs = Number(data.readBigUInt64BE(offset + 11));
      const expiresAtMs = Number(data.readBigUInt64BE(offset + 19));
      const keyLen = data.readUInt32BE(offset + 27);
      const valLen = data.readUInt32BE(offset + 31);

      const totalRecordLen = FIXED_RECORD_HEADER_LEN + keyLen + valLen + RECORD_CRC_LEN;
      if (remainingLen < totalRecordLen) {
        console.warn(`[Storage Recovery] Incomplete record payload at offset ${offset}, truncating log tail`);
        break;
      }

      const keyStart = offset + FIXED_RECORD_HEADER_LEN;
      const valStart = keyStart + keyLen;
      const crcStart = valStart + valLen;

      const expectedCrc = data.readUInt32BE(crcStart);
      const payloadToCheck = data.subarray(offset + 2, crcStart);
      const calculatedCrc = zlib.crc32(payloadToCheck);

      if (calculatedCrc !== expectedCrc) {
        console.warn(`[Storage Recovery] CRC32 mismatch at offset ${offset} (expected ${expectedCrc}, got ${calculatedCrc}), truncating`);
        break;
      }

      const key = data.subarray(keyStart, valStart).toString('utf-8');
      const val = Buffer.from(data.subarray(valStart, crcStart));

      if (seq >= this.nextSeq) {
        this.nextSeq = seq + 1n;
      }

      if (recType === RecordType.Set) {
        if (expiresAtMs === 0 || expiresAtMs > nowMs) {
          this.index.set(key, { value: val, expiresAtMs, seq });
          recoveredCount++;
        }
      } else if (recType === RecordType.Delete) {
        this.index.delete(key);
      } else if (recType === RecordType.Expire) {
        const item = this.index.get(key);
        if (item) {
          item.expiresAtMs = expiresAtMs;
          if (expiresAtMs !== 0 && expiresAtMs <= nowMs) {
            this.index.delete(key);
          }
        }
      }

      offset += totalRecordLen;
      lastValidOffset = offset;
    }

    // Truncate any torn tail
    if (lastValidOffset < data.length) {
      fs.truncateSync(this.segmentPath, lastValidOffset);
      console.info(`[Storage Recovery] Truncated segment log from ${data.length} to ${lastValidOffset} bytes`);
    }

    console.info(`[Storage Recovery] Recovered ${recoveredCount} valid keys, next sequence: ${this.nextSeq}`);
  }

  _appendRecord(recType, keyBuf, valBuf, expiresAtMs = 0) {
    const seq = this.nextSeq++;
    const nowMs = Date.now();
    const keyLen = keyBuf.length;
    const valLen = valBuf.length;
    const totalLen = FIXED_RECORD_HEADER_LEN + keyLen + valLen + RECORD_CRC_LEN;
    const buf = Buffer.alloc(totalLen);

    buf.set(RECORD_MAGIC, 0);
    buf[2] = recType;
    buf.writeBigUInt64BE(seq, 3);
    buf.writeBigUInt64BE(BigInt(nowMs), 11);
    buf.writeBigUInt64BE(BigInt(expiresAtMs), 19);
    buf.writeUInt32BE(keyLen, 27);
    buf.writeUInt32BE(valLen, 31);

    buf.set(keyBuf, FIXED_RECORD_HEADER_LEN);
    buf.set(valBuf, FIXED_RECORD_HEADER_LEN + keyLen);

    const checkSlice = buf.subarray(2, FIXED_RECORD_HEADER_LEN + keyLen + valLen);
    const crc = zlib.crc32(checkSlice);
    buf.writeUInt32BE(crc, FIXED_RECORD_HEADER_LEN + keyLen + valLen);

    fs.writeSync(this.segmentFd, buf, 0, buf.length, this.segmentSize);
    this.segmentSize += buf.length;

    if (this.durability === 'fsync') {
      fs.fdatasyncSync(this.segmentFd);
    } else {
      this.dirty = true;
    }

    return seq;
  }

  async set(key, value, ttlMs = null) {
    const keyBuf = Buffer.isBuffer(key) ? key : Buffer.from(String(key));
    const valBuf = Buffer.isBuffer(value) ? value : Buffer.from(typeof value === 'object' ? JSON.stringify(value) : String(value));
    const nowMs = Date.now();
    const expiresAtMs = ttlMs && ttlMs > 0 ? nowMs + Number(ttlMs) : 0;

    const seq = this._appendRecord(RecordType.Set, keyBuf, valBuf, expiresAtMs);
    this.index.set(keyBuf.toString('utf-8'), {
      value: valBuf,
      expiresAtMs,
      seq,
    });
    return seq;
  }

  async get(key) {
    const k = String(key);
    const entry = this.index.get(k);
    if (!entry) return null;

    if (entry.expiresAtMs !== 0 && entry.expiresAtMs <= Date.now()) {
      this.index.delete(k);
      return null;
    }
    return entry.value;
  }

  async delete(key) {
    const k = String(key);
    if (!this.index.has(k)) return false;

    this.index.delete(k);
    const keyBuf = Buffer.from(k);
    this._appendRecord(RecordType.Delete, keyBuf, Buffer.alloc(0), 0);
    return true;
  }

  async exists(key) {
    return (await this.get(key)) !== null;
  }

  async expire(key, ttlMs) {
    const k = String(key);
    const entry = this.index.get(k);
    if (!entry) return false;

    if (entry.expiresAtMs !== 0 && entry.expiresAtMs <= Date.now()) {
      this.index.delete(k);
      return false;
    }

    const expiresAtMs = Date.now() + Number(ttlMs);
    entry.expiresAtMs = expiresAtMs;
    const keyBuf = Buffer.from(k);
    this._appendRecord(RecordType.Expire, keyBuf, Buffer.alloc(0), expiresAtMs);
    return true;
  }

  async ttl(key) {
    const k = String(key);
    const entry = this.index.get(k);
    if (!entry) return null;

    if (entry.expiresAtMs === 0) return -1;
    const remaining = entry.expiresAtMs - Date.now();
    if (remaining <= 0) {
      this.index.delete(k);
      return null;
    }
    return remaining;
  }

  async setNx(key, value, ttlMs = null) {
    if (await this.exists(key)) return false;
    await this.set(key, value, ttlMs);
    return true;
  }

  async cas(key, expectedValue, newValue, ttlMs = null) {
    const current = await this.get(key);
    if (!current) return false;

    const expBuf = Buffer.isBuffer(expectedValue) ? expectedValue : Buffer.from(String(expectedValue));
    if (current.equals(expBuf)) {
      await this.set(key, newValue, ttlMs);
      return true;
    }
    return false;
  }

  async incr(key, delta = 1) {
    const current = await this.get(key);
    let num = 0;
    if (current) {
      num = parseInt(current.toString('utf-8').trim(), 10) || 0;
    }
    const newNum = num + delta;
    await this.set(key, String(newNum));
    return newNum;
  }

  async keys(prefix = null) {
    const nowMs = Date.now();
    const result = [];
    for (const [k, entry] of this.index.entries()) {
      if (entry.expiresAtMs !== 0 && entry.expiresAtMs <= nowMs) {
        continue;
      }
      if (!prefix || k.startsWith(prefix)) {
        result.push(k);
      }
    }
    return result;
  }

  async compact() {
    // Perform online log compaction: write all currently active non-expired keys to a new segment
    const tmpPath = path.join(this.dataDir, 'segment_compact.tmp');
    const tmpFd = fs.openSync(tmpPath, 'w');
    let offset = 0;
    const nowMs = Date.now();

    for (const [key, entry] of this.index.entries()) {
      if (entry.expiresAtMs !== 0 && entry.expiresAtMs <= nowMs) {
        continue; // Skip expired keys
      }

      const keyBuf = Buffer.from(key);
      const valBuf = entry.value;
      const keyLen = keyBuf.length;
      const valLen = valBuf.length;
      const totalLen = FIXED_RECORD_HEADER_LEN + keyLen + valLen + RECORD_CRC_LEN;
      const buf = Buffer.alloc(totalLen);

      buf.set(RECORD_MAGIC, 0);
      buf[2] = RecordType.Set;
      buf.writeBigUInt64BE(entry.seq, 3);
      buf.writeBigUInt64BE(BigInt(nowMs), 11);
      buf.writeBigUInt64BE(BigInt(entry.expiresAtMs), 19);
      buf.writeUInt32BE(keyLen, 27);
      buf.writeUInt32BE(valLen, 31);
      buf.set(keyBuf, FIXED_RECORD_HEADER_LEN);
      buf.set(valBuf, FIXED_RECORD_HEADER_LEN + keyLen);

      const checkSlice = buf.subarray(2, FIXED_RECORD_HEADER_LEN + keyLen + valLen);
      const crc = zlib.crc32(checkSlice);
      buf.writeUInt32BE(crc, FIXED_RECORD_HEADER_LEN + keyLen + valLen);

      fs.writeSync(tmpFd, buf, 0, buf.length, offset);
      offset += buf.length;
    }

    fs.fdatasyncSync(tmpFd);
    fs.closeSync(tmpFd);

    // Close active file descriptor, swap files, and reopen
    if (this.segmentFd) {
      fs.closeSync(this.segmentFd);
    }

    fs.renameSync(tmpPath, this.segmentPath);
    this.segmentFd = fs.openSync(this.segmentPath, 'r+');
    this.segmentSize = offset;
    this.dirty = false;

    console.info(`[Storage Compaction] Completed compaction. New segment size: ${offset} bytes`);
    return offset;
  }

  async close() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.segmentFd) {
      try {
        fs.fdatasyncSync(this.segmentFd);
        fs.closeSync(this.segmentFd);
      } catch (e) {}
      this.segmentFd = null;
    }
  }
}

module.exports = {
  AofEngine,
  RecordType,
  RECORD_MAGIC,
};
