import struct
from typing import Tuple, Optional

MAGIC = b"NEXO"
PROTOCOL_VERSION = 1
HEADER_LEN = 24

class MessageType:
    REQUEST = 1
    RESPONSE = 2
    PING = 3
    PONG = 4

class CommandId:
    AUTH = 0x0001
    PING = 0x0002
    INFO = 0x0003

    SET = 0x0010
    GET = 0x0011
    DEL = 0x0012
    EXISTS = 0x0013
    EXPIRE = 0x0014
    TTL = 0x0015
    SET_NX = 0x0016
    CAS = 0x0017
    INCR = 0x0018
    DECR = 0x0019
    KEYS = 0x001A

    QUEUE_ADD = 0x0020
    QUEUE_FETCH = 0x0021
    QUEUE_ACK = 0x0022
    QUEUE_FAIL = 0x0023
    QUEUE_INSPECT = 0x0024
    QUEUE_CANCEL = 0x0025
    QUEUE_RETRY = 0x0026
    QUEUE_LIST = 0x0027

class StatusCode:
    OK = 0x0000
    CREATED = 0x0001
    NOT_FOUND = 0x0002
    UNAUTHORIZED = 0x0003
    BAD_REQUEST = 0x0004
    CONFLICT = 0x0005
    SERVER_ERROR = 0x0006
    LEASE_EXPIRED = 0x0007
    RATE_LIMITED = 0x0008
    TIMEOUT = 0x0009

def crc16(data: bytes) -> int:
    crc = 0xFFFF
    for byte in data:
        crc ^= (byte << 8)
        for _ in range(8):
            if crc & 0x8000:
                crc = ((crc << 1) ^ 0x1021) & 0xFFFF
            else:
                crc = (crc << 1) & 0xFFFF
    return crc

def encode_frame(message_type: int, command_or_status: int, correlation_id: int, payload: bytes = b"", flags: int = 0) -> bytes:
    payload_len = len(payload)
    raw_header = struct.pack(
        ">4sBBHQHI",
        MAGIC,
        PROTOCOL_VERSION,
        message_type,
        flags,
        correlation_id,
        command_or_status,
        payload_len,
    )
    checksum = crc16(raw_header)
    header = raw_header + struct.pack(">H", checksum)
    return header + payload

def decode_header(buffer: bytes) -> Optional[Tuple[int, int, int, int, int, int]]:
    if len(buffer) < HEADER_LEN:
        return None
    raw_header = buffer[:22]
    expected_checksum = struct.unpack(">H", buffer[22:24])[0]
    calculated_checksum = crc16(raw_header)
    if calculated_checksum != expected_checksum:
        raise ValueError("Header checksum mismatch")

    magic, version, msg_type, flags, correlation_id, cmd_or_status, payload_len = struct.unpack(
        ">4sBBHQHI", raw_header
    )
    if magic != MAGIC:
        raise ValueError("Invalid magic bytes")
    if version != PROTOCOL_VERSION:
        raise ValueError(f"Unsupported protocol version {version}")

    return (version, msg_type, flags, correlation_id, cmd_or_status, payload_len)
