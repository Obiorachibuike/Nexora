# Nexora Binary Protocol (NBP/1.0) Specification

## 1. Overview

The Nexora Binary Protocol (NBP) is a multiplexed, length-prefixed, request-correlated binary protocol designed for bidirectional communication between client SDKs and the Nexora infrastructure server over TCP.

NBP delivers low-latency serialization, framing integrity checks, explicit correlation tracking, and safe error propagation across all 20 supported languages.

---

## 2. Wire Framing Format

Every message exchanged across an NBP TCP socket consists of a fixed **22-byte header** followed by an optional variable-length payload.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Magic: "NEXO"                           |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Version    |  Message Type |             Flags             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Correlation ID (64-bit)                    +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Command ID / Status Code   |         Payload Length        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Payload Len  |    Header Checksum (CRC16)    |               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+               +
|                                                               |
|                   Variable-Length Payload                     |
|                   (Payload Length bytes)                      |
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 2.1 Field Descriptions

| Offset | Field | Type | Description |
|---|---|---|---|
| 0..3 | **Magic** | `[u8; 4]` | ASCII `"NEXO"` (`0x4E, 0x45, 0x58, 0x4F`). Identifies valid frames. |
| 4 | **Version** | `u8` | Protocol version (`0x01` for NBP/1.0). |
| 5 | **Message Type** | `u8` | `0x01` = Request, `0x02` = Response, `0x03` = Ping, `0x04` = Pong. |
| 6..7 | **Flags** | `u16` (BE) | Bitfield: `0x0001` = Compressed (gzip), `0x0002` = Binary payload (vs JSON). |
| 8..15 | **Correlation ID** | `u64` (BE) | Unique request-response pairing identifier assigned by the client. |
| 16..17 | **Command / Status** | `u16` (BE) | In Request: Command ID. In Response: Status Code. |
| 18..21 | **Payload Length** | `u32` (BE) | Number of bytes in payload. Maximum standard limit: 16 MB (`16,777,216` bytes). |
| 22..23 | **Header Checksum**| `u16` (BE) | CRC16 checksum computed across bytes 0 to 21. |

---

## 3. Command Identifiers (Request)

### System & Connection
- `0x0001`: `AUTH` - Authenticate connection using API key
- `0x0002`: `PING` - Heartbeat probe
- `0x0003`: `INFO` - Query server status, version, and capabilities

### Key-Value & Storage
- `0x0010`: `SET` - Store key-value with optional TTL
- `0x0011`: `GET` - Retrieve value by key
- `0x0012`: `DEL` - Delete key
- `0x0013`: `EXISTS` - Check existence of key
- `0x0014`: `EXPIRE` - Set expiration timestamp for key
- `0x0015`: `TTL` - Query remaining TTL in milliseconds
- `0x0016`: `SET_NX` - Set key if absent (atomic)
- `0x0017`: `CAS` - Compare and set key value (atomic)
- `0x0018`: `INCR` - Increment numeric value atomically
- `0x0019`: `DECR` - Decrement numeric value atomically
- `0x001A`: `KEYS` - Prefix or paginated key iteration

### Durable Queues & Jobs
- `0x0020`: `Q_ADD` - Enqueue job (with priority, delay, dedup key)
- `0x0021`: `Q_FETCH` - Atomically claim next eligible job with lease
- `0x0022`: `Q_ACK` - Acknowledge and mark job completed
- `0x0023`: `Q_FAIL` - Report job failure (triggers retry or dead-letter)
- `0x0024`: `Q_INSPECT` - Inspect job details and lifecycle history
- `0x0025`: `Q_CANCEL` - Cancel pending or delayed job
- `0x0026`: `Q_RETRY` - Manually requeue failed/dead-lettered job
- `0x0027`: `Q_LIST` - List queues and aggregate statistics

### Event Messaging
- `0x0030`: `EV_PUB` - Publish event to topic
- `0x0031`: `EV_SUB` - Subscribe consumer group to topic
- `0x0032`: `EV_ACK` - Acknowledge event processed by consumer

### Scheduler
- `0x0040`: `SCH_ADD` - Register recurring interval or cron schedule
- `0x0041`: `SCH_LIST` - List active schedules
- `0x0042`: `SCH_CANCEL` - Cancel schedule

---

## 4. Status Codes (Response)

- `0x0000`: `OK` - Success
- `0x0001`: `CREATED` - Resource successfully created
- `0x0002`: `NOT_FOUND` - Target key, queue, or job does not exist
- `0x0003`: `UNAUTHORIZED` - Authentication failed or required
- `0x0004`: `BAD_REQUEST` - Malformed payload or validation error
- `0x0005`: `CONFLICT` - Version mismatch or duplicate key violation
- `0x0006`: `SERVER_ERROR` - Internal server error
- `0x0007`: `LEASE_EXPIRED` - Worker lease expired or fenced out
- `0x0008`: `RATE_LIMITED` - Concurrency or request rate limit exceeded
- `0x0009`: `TIMEOUT` - Operation timed out

---

## 5. Payloads

Payloads are JSON strings encoded in UTF-8 by default. Binary payloads are flagged with `0x0002` in the Flags field.

### Example: SET Request Payload
```json
{
  "key": "user:123",
  "value": "{\"name\": \"Ada Lovelace\"}",
  "ttl_ms": 60000
}
```

### Example: SET Response Payload
```json
{
  "status": "ok",
  "key": "user:123",
  "version": 1
}
```
