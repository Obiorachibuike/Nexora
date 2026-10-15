use byteorder::{BigEndian, ByteOrder};
use bytes::{Bytes, BytesMut};
use serde_json::Value;
use std::net::SocketAddr;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use thiserror::Error;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::sync::Mutex;

#[derive(Error, Debug)]
pub enum Error {
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("Protocol error: {0}")]
    Protocol(String),
    #[error("Server error: {0}")]
    Server(String),
}

pub type Result<T> = std::result::Result<T, Error>;

pub const MAGIC: &[u8; 4] = b"NEXO";
pub const HEADER_LEN: usize = 24;

fn crc16(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;
    for &b in data {
        crc ^= (b as u16) << 8;
        for _ in 0..8 {
            if crc & 0x8000 != 0 {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc <<= 1;
            }
        }
    }
    crc
}

pub struct NexoraClient {
    stream: Arc<Mutex<TcpStream>>,
    correlation: AtomicU64,
}

impl NexoraClient {
    pub async fn connect(addr: SocketAddr, api_key: Option<&str>) -> Result<Self> {
        let mut stream = TcpStream::connect(addr).await?;
        let correlation = AtomicU64::new(1);

        if let Some(key) = api_key {
            let payload = serde_json::json!({ "api_key": key });
            Self::send_raw(&mut stream, 1, 0x0001, &payload).await?;
        }

        Ok(Self {
            stream: Arc::new(Mutex::new(stream)),
            correlation,
        })
    }

    async fn send_raw(stream: &mut TcpStream, cid: u64, cmd: u16, payload: &Value) -> Result<Value> {
        let payload_bytes = serde_json::to_vec(payload)?;
        let plen = payload_bytes.len() as u32;

        let mut hdr = [0u8; HEADER_LEN];
        hdr[0..4].copy_from_slice(MAGIC);
        hdr[4] = 1; // version
        hdr[5] = 1; // req
        BigEndian::write_u64(&mut hdr[8..16], cid);
        BigEndian::write_u16(&mut hdr[16..18], cmd);
        BigEndian::write_u32(&mut hdr[18..22], plen);
        let checksum = crc16(&hdr[0..22]);
        BigEndian::write_u16(&mut hdr[22..24], checksum);

        stream.write_all(&hdr).await?;
        stream.write_all(&payload_bytes).await?;

        let mut resp_hdr = [0u8; HEADER_LEN];
        stream.read_exact(&mut resp_hdr).await?;

        let status = BigEndian::read_u16(&resp_hdr[16..18]);
        let resp_plen = BigEndian::read_u32(&resp_hdr[18..22]) as usize;

        let mut resp_payload = vec![0u8; resp_plen];
        if resp_plen > 0 {
            stream.read_exact(&mut resp_payload).await?;
        }

        if status != 0 && status != 1 {
            let err_msg = String::from_utf8_lossy(&resp_payload).to_string();
            return Err(Error::Server(err_msg));
        }

        if resp_plen > 0 {
            let val: Value = serde_json::from_slice(&resp_payload)?;
            Ok(val)
        } else {
            Ok(Value::Null)
        }
    }

    pub async fn ping(&self) -> Result<bool> {
        let cid = self.correlation.fetch_add(1, Ordering::SeqCst);
        let mut stream = self.stream.lock().await;
        let resp = Self::send_raw(&mut stream, cid, 0x0002, &serde_json::json!({})).await?;
        Ok(resp.get("pong").and_then(|v| v.as_bool()).unwrap_or(false))
    }

    pub async fn set(&self, key: &str, value: &str, ttl_ms: Option<u64>) -> Result<()> {
        let cid = self.correlation.fetch_add(1, Ordering::SeqCst);
        let mut payload = serde_json::json!({ "key": key, "value": value });
        if let Some(t) = ttl_ms {
            payload["ttl_ms"] = serde_json::json!(t);
        }
        let mut stream = self.stream.lock().await;
        Self::send_raw(&mut stream, cid, 0x0010, &payload).await?;
        Ok(())
    }

    pub async fn get(&self, key: &str) -> Result<Option<String>> {
        let cid = self.correlation.fetch_add(1, Ordering::SeqCst);
        let payload = serde_json::json!({ "key": key });
        let mut stream = self.stream.lock().await;
        match Self::send_raw(&mut stream, cid, 0x0011, &payload).await {
            Ok(resp) => Ok(resp.get("value").and_then(|v| v.as_str()).map(|s| s.to_string())),
            Err(Error::Server(_)) => Ok(None),
            Err(e) => Err(e),
        }
    }
}
