use byteorder::{BigEndian, ByteOrder};
use crc32fast::Hasher;
use nexora_core::{NexoraError, Result};

pub const RECORD_MAGIC: [u8; 2] = [0xAA, 0x55];
pub const FIXED_RECORD_HEADER_LEN: usize = 2 + 1 + 8 + 8 + 8 + 4 + 4; // 35 bytes
pub const RECORD_CRC_LEN: usize = 4;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum RecordType {
    Set = 0x01,
    Delete = 0x02,
    Expire = 0x03,
    QueueJobCreate = 0x04,
    QueueJobUpdate = 0x05,
    Event = 0x06,
    Schedule = 0x07,
}

impl TryFrom<u8> for RecordType {
    type Error = &'static str;
    fn try_from(v: u8) -> std::result::Result<Self, Self::Error> {
        match v {
            0x01 => Ok(RecordType::Set),
            0x02 => Ok(RecordType::Delete),
            0x03 => Ok(RecordType::Expire),
            0x04 => Ok(RecordType::QueueJobCreate),
            0x05 => Ok(RecordType::QueueJobUpdate),
            0x06 => Ok(RecordType::Event),
            0x07 => Ok(RecordType::Schedule),
            _ => Err("Unknown record type"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StorageRecord {
    pub record_type: RecordType,
    pub seq: u64,
    pub timestamp_ms: u64,
    pub expires_at_ms: u64, // 0 for no expiration
    pub key: Vec<u8>,
    pub value: Vec<u8>,
}

impl StorageRecord {
    pub fn encode(&self) -> Vec<u8> {
        let key_len = self.key.len() as u32;
        let val_len = self.value.len() as u32;
        let total_size = FIXED_RECORD_HEADER_LEN + key_len as usize + val_len as usize + RECORD_CRC_LEN;
        let mut buf = vec![0u8; total_size];

        buf[0..2].copy_from_slice(&RECORD_MAGIC);
        buf[2] = self.record_type as u8;
        BigEndian::write_u64(&mut buf[3..11], self.seq);
        BigEndian::write_u64(&mut buf[11..19], self.timestamp_ms);
        BigEndian::write_u64(&mut buf[19..27], self.expires_at_ms);
        BigEndian::write_u32(&mut buf[27..31], key_len);
        BigEndian::write_u32(&mut buf[31..35], val_len);

        let mut offset = 35;
        buf[offset..offset + key_len as usize].copy_from_slice(&self.key);
        offset += key_len as usize;
        buf[offset..offset + val_len as usize].copy_from_slice(&self.value);
        offset += val_len as usize;

        let mut hasher = Hasher::new();
        hasher.update(&buf[2..offset]);
        let crc = hasher.finalize();
        BigEndian::write_u32(&mut buf[offset..offset + 4], crc);

        buf
    }

    pub fn decode(buf: &[u8]) -> Result<(Self, usize)> {
        if buf.len() < FIXED_RECORD_HEADER_LEN + RECORD_CRC_LEN {
            return Err(NexoraError::Storage("Record buffer too short".into()));
        }

        if buf[0..2] != RECORD_MAGIC {
            return Err(NexoraError::Storage("Invalid record magic".into()));
        }

        let record_type = RecordType::try_from(buf[2])
            .map_err(|e| NexoraError::Storage(e.to_string()))?;
        let seq = BigEndian::read_u64(&buf[3..11]);
        let timestamp_ms = BigEndian::read_u64(&buf[11..19]);
        let expires_at_ms = BigEndian::read_u64(&buf[19..27]);
        let key_len = BigEndian::read_u32(&buf[27..31]) as usize;
        let val_len = BigEndian::read_u32(&buf[31..35]) as usize;

        let record_total_len = FIXED_RECORD_HEADER_LEN + key_len + val_len + RECORD_CRC_LEN;
        if buf.len() < record_total_len {
            return Err(NexoraError::Storage("Incomplete record payload".into()));
        }

        let key_start = FIXED_RECORD_HEADER_LEN;
        let key_end = key_start + key_len;
        let val_end = key_end + val_len;

        let expected_crc = BigEndian::read_u32(&buf[val_end..val_end + 4]);
        let mut hasher = Hasher::new();
        hasher.update(&buf[2..val_end]);
        let calculated_crc = hasher.finalize();

        if calculated_crc != expected_crc {
            return Err(NexoraError::CrcMismatch {
                expected: expected_crc,
                calculated: calculated_crc,
            });
        }

        let key = buf[key_start..key_end].to_vec();
        let value = buf[key_end..val_end].to_vec();

        Ok((
            Self {
                record_type,
                seq,
                timestamp_ms,
                expires_at_ms,
                key,
                value,
            },
            record_total_len,
        ))
    }
}
