use crate::record::*;
use nexora_core::{DurabilityPolicy, NexoraError, Result};
use std::fs::{File, OpenOptions};
use std::io::{Read, Seek, SeekFrom, Write};
use std::path::{Path, PathBuf};
use tracing::{error, info, warn};

pub struct SegmentFile {
    pub id: u64,
    pub path: PathBuf,
    pub file: File,
    pub size: u64,
}

impl SegmentFile {
    pub fn open_or_create(dir: &Path, id: u64) -> Result<Self> {
        let path = dir.join(format!("segment_{:08}.log", id));
        let file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&path)?;
        let size = file.metadata()?.len();
        Ok(Self { id, path, file, size })
    }

    pub fn append(&mut self, record_bytes: &[u8], durability: DurabilityPolicy) -> Result<u64> {
        let offset = self.size;
        self.file.seek(SeekFrom::End(0))?;
        self.file.write_all(record_bytes)?;
        match durability {
            DurabilityPolicy::Fsync => {
                self.file.sync_data()?;
            }
            DurabilityPolicy::EverySec | DurabilityPolicy::None => {
                self.file.flush()?;
            }
        }
        self.size += record_bytes.len() as u64;
        Ok(offset)
    }

    pub fn scan_and_recover(&mut self) -> Result<(Vec<(StorageRecord, u64)>, u64)> {
        self.file.seek(SeekFrom::Start(0))?;
        let mut buffer = Vec::new();
        self.file.read_to_end(&mut buffer)?;

        let mut records = Vec::new();
        let mut cursor = 0usize;
        let mut last_valid_offset = 0u64;

        while cursor < buffer.len() {
            let remaining = &buffer[cursor..];
            if remaining.len() < FIXED_RECORD_HEADER_LEN + RECORD_CRC_LEN {
                warn!("Torn write detected at offset {} in segment {:08}, truncating tail", cursor, self.id);
                self.file.set_len(last_valid_offset)?;
                self.size = last_valid_offset;
                break;
            }

            match StorageRecord::decode(remaining) {
                Ok((rec, record_len)) => {
                    records.push((rec, cursor as u64));
                    cursor += record_len;
                    last_valid_offset = cursor as u64;
                }
                Err(NexoraError::CrcMismatch { .. }) | Err(NexoraError::Storage(_)) => {
                    warn!("Corrupted or truncated record encountered at offset {}, truncating tail", cursor);
                    self.file.set_len(last_valid_offset)?;
                    self.size = last_valid_offset;
                    break;
                }
                Err(e) => return Err(e),
            }
        }

        Ok((records, last_valid_offset))
    }
}
