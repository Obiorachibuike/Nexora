use crate::command::*;
use byteorder::{BigEndian, ByteOrder};
use bytes::{BufMut, Bytes, BytesMut};
use nexora_core::{NexoraError, Result};

pub const HEADER_LEN: usize = 24;

/// Computes CRC16-CCITT for protocol header checksum
pub fn crc16_ccitt(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;
    for &byte in data {
        crc ^= (byte as u16) << 8;
        for _ in 0..8 {
            if (crc & 0x8000) != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    crc
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FrameHeader {
    pub magic: [u8; 4],
    pub version: u8,
    pub message_type: MessageType,
    pub flags: u16,
    pub correlation_id: u64,
    pub command_or_status: u16,
    pub payload_len: u32,
    pub checksum: u16,
}

impl FrameHeader {
    pub fn encode(&self) -> [u8; HEADER_LEN] {
        let mut buf = [0u8; HEADER_LEN];
        buf[0..4].copy_from_slice(&self.magic);
        buf[4] = self.version;
        buf[5] = self.message_type as u8;
        BigEndian::write_u16(&mut buf[6..8], self.flags);
        BigEndian::write_u64(&mut buf[8..16], self.correlation_id);
        BigEndian::write_u16(&mut buf[16..18], self.command_or_status);
        BigEndian::write_u32(&mut buf[18..22], self.payload_len);
        let checksum = crc16_ccitt(&buf[0..22]);
        BigEndian::write_u16(&mut buf[22..24], checksum);
        buf
    }

    pub fn decode(buf: &[u8]) -> Result<Self> {
        if buf.len() < HEADER_LEN {
            return Err(NexoraError::Protocol("Header buffer too short".into()));
        }

        if &buf[0..4] != MAGIC_BYTES {
            return Err(NexoraError::Protocol("Invalid magic bytes".into()));
        }

        let version = buf[4];
        if version != PROTOCOL_VERSION {
            return Err(NexoraError::Protocol(format!("Unsupported protocol version: {}", version)));
        }

        let message_type = MessageType::try_from(buf[5])
            .map_err(|e| NexoraError::Protocol(e.to_string()))?;
        let flags = BigEndian::read_u16(&buf[6..8]);
        let correlation_id = BigEndian::read_u64(&buf[8..16]);
        let command_or_status = BigEndian::read_u16(&buf[16..18]);
        let payload_len = BigEndian::read_u32(&buf[18..22]);
        let expected_checksum = BigEndian::read_u16(&buf[22..24]);

        let calculated_checksum = crc16_ccitt(&buf[0..22]);
        if calculated_checksum != expected_checksum {
            return Err(NexoraError::Protocol("Header CRC16 mismatch".into()));
        }

        Ok(Self {
            magic: *MAGIC_BYTES,
            version,
            message_type,
            flags,
            correlation_id,
            command_or_status,
            payload_len,
            checksum: expected_checksum,
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Frame {
    pub header: FrameHeader,
    pub payload: Bytes,
}

impl Frame {
    pub fn new_request(command: CommandId, correlation_id: u64, payload: Bytes) -> Self {
        let payload_len = payload.len() as u32;
        let mut header = FrameHeader {
            magic: *MAGIC_BYTES,
            version: PROTOCOL_VERSION,
            message_type: MessageType::Request,
            flags: 0,
            correlation_id,
            command_or_status: command as u16,
            payload_len,
            checksum: 0,
        };
        header.checksum = crc16_ccitt(&header.encode()[0..22]);
        Self { header, payload }
    }

    pub fn new_response(status: StatusCode, correlation_id: u64, payload: Bytes) -> Self {
        let payload_len = payload.len() as u32;
        let mut header = FrameHeader {
            magic: *MAGIC_BYTES,
            version: PROTOCOL_VERSION,
            message_type: MessageType::Response,
            flags: 0,
            correlation_id,
            command_or_status: status as u16,
            payload_len,
            checksum: 0,
        };
        header.checksum = crc16_ccitt(&header.encode()[0..22]);
        Self { header, payload }
    }

    pub fn to_bytes(&self) -> Bytes {
        let mut buf = BytesMut::with_capacity(HEADER_LEN + self.payload.len());
        buf.put_slice(&self.header.encode());
        buf.put_slice(&self.payload);
        buf.freeze()
    }
}
