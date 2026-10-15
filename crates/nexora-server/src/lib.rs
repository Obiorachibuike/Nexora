use bytes::Bytes;
use nexora_admin::{create_admin_router, AdminState};
use nexora_auth::AuthManager;
use nexora_cache::NexoraCache;
use nexora_core::{Result, ServerConfig};
use nexora_events::EventBroker;
use nexora_metrics::NexoraMetrics;
use nexora_protocol::*;
use nexora_queue::QueueEngine;
use nexora_scheduler::NexoraScheduler;
use nexora_storage::AofEngine;
use nexora_workers::WorkerRegistry;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tracing::{error, info, warn};

pub struct NexoraServer {
    config: ServerConfig,
    storage: Arc<AofEngine>,
    cache: Arc<NexoraCache>,
    queue: Arc<QueueEngine>,
    events: Arc<EventBroker>,
    scheduler: Arc<NexoraScheduler>,
    workers: Arc<WorkerRegistry>,
    auth: Arc<AuthManager>,
    metrics: Arc<NexoraMetrics>,
}

impl NexoraServer {
    pub fn new(config: ServerConfig) -> Result<Self> {
        let storage = Arc::new(AofEngine::open(config.storage.clone())?);
        let cache = Arc::new(NexoraCache::new(50000));
        let queue = Arc::new(QueueEngine::new(storage.clone()));
        let events = Arc::new(EventBroker::new(storage.clone()));
        let scheduler = Arc::new(NexoraScheduler::new(storage.clone()));
        let workers = Arc::new(WorkerRegistry::new(config.worker_lease_ttl_ms));
        let auth = Arc::new(AuthManager::new(config.api_key.as_deref()));
        let metrics = Arc::new(NexoraMetrics::new());

        Ok(Self {
            config,
            storage,
            cache,
            queue,
            events,
            scheduler,
            workers,
            auth,
            metrics,
        })
    }

    pub async fn run(self) -> Result<()> {
        let tcp_addr: SocketAddr = format!("{}:{}", self.config.bind_addr, self.config.tcp_port)
            .parse()
            .map_err(|e: std::net::AddrParseError| nexora_core::NexoraError::Configuration(e.to_string()))?;

        let listener = TcpListener::bind(tcp_addr).await?;
        info!("Nexora TCP binary server listening on {}", tcp_addr);

        // Start HTTP Admin Server
        let admin_addr: SocketAddr = format!("{}:{}", self.config.bind_addr, self.config.http_port)
            .parse()
            .map_err(|e: std::net::AddrParseError| nexora_core::NexoraError::Configuration(e.to_string()))?;
        let admin_state = AdminState {
            metrics: self.metrics.clone(),
            storage: self.storage.clone(),
        };
        let app = create_admin_router(admin_state);

        tokio::spawn(async move {
            info!("Nexora HTTP Admin API listening on {}", admin_addr);
            if let Ok(listener) = tokio::net::TcpListener::bind(admin_addr).await {
                let _ = axum::serve(listener, app).await;
            }
        });

        // Main TCP Accept Loop
        loop {
            let (socket, remote_addr) = listener.accept().await?;
            let server_ref = Arc::new(self.clone());
            tokio::spawn(async move {
                if let Err(e) = server_ref.handle_client(socket, remote_addr).await {
                    warn!("Client {} disconnected with error: {:?}", remote_addr, e);
                }
            });
        }
    }

    async fn handle_client(&self, mut socket: TcpStream, remote: SocketAddr) -> Result<()> {
        self.metrics.inc_connections();
        let mut authenticated = !self.auth.is_auth_required();
        let mut buf = vec![0u8; 1024 * 64];

        loop {
            let n = socket.read(&mut buf).await?;
            if n == 0 {
                break; // Connection closed
            }

            self.metrics.record_request();
            if n < frame::HEADER_LEN {
                continue;
            }

            let header = match FrameHeader::decode(&buf[0..frame::HEADER_LEN]) {
                Ok(h) => h,
                Err(_) => {
                    self.metrics.record_error();
                    let resp = Frame::new_response(StatusCode::BadRequest, 0, Bytes::from("Bad header"));
                    socket.write_all(&resp.to_bytes()).await?;
                    continue;
                }
            };

            let payload_start = frame::HEADER_LEN;
            let payload_end = payload_start + header.payload_len as usize;
            let payload_bytes = if n >= payload_end {
                &buf[payload_start..payload_end]
            } else {
                &buf[payload_start..n]
            };

            // Authentication check
            if !authenticated && header.command_or_status != CommandId::Auth as u16 {
                let resp = Frame::new_response(StatusCode::Unauthorized, header.correlation_id, Bytes::from("Auth required"));
                socket.write_all(&resp.to_bytes()).await?;
                continue;
            }

            // Command dispatch
            let resp = match CommandId::try_from(header.command_or_status) {
                Ok(CommandId::Auth) => {
                    if let Ok(v) = serde_json::from_slice::<serde_json::Value>(payload_bytes) {
                        let key = v.get("api_key").and_then(|k| k.as_str()).unwrap_or("");
                        if self.auth.verify_key(key).is_ok() {
                            authenticated = true;
                            Frame::new_response(StatusCode::Ok, header.correlation_id, Bytes::from("{\"status\":\"ok\"}"))
                        } else {
                            Frame::new_response(StatusCode::Unauthorized, header.correlation_id, Bytes::from("Invalid API key"))
                        }
                    } else {
                        Frame::new_response(StatusCode::BadRequest, header.correlation_id, Bytes::from("Invalid JSON"))
                    }
                }
                Ok(CommandId::Ping) => {
                    Frame::new_response(StatusCode::Ok, header.correlation_id, Bytes::from("{\"pong\":true}"))
                }
                Ok(CommandId::Set) => {
                    if let Ok(v) = serde_json::from_slice::<serde_json::Value>(payload_bytes) {
                        let key = v.get("key").and_then(|k| k.as_str()).unwrap_or("").as_bytes().to_vec();
                        let val = v.get("value").and_then(|val| val.as_str()).unwrap_or("").as_bytes().to_vec();
                        let ttl_ms = v.get("ttl_ms").and_then(|t| t.as_u64());

                        match self.storage.set(key, val, ttl_ms).await {
                            Ok(seq) => Frame::new_response(
                                StatusCode::Ok,
                                header.correlation_id,
                                Bytes::from(format!("{{\"status\":\"ok\",\"seq\":{}}}", seq)),
                            ),
                            Err(e) => Frame::new_response(
                                StatusCode::ServerError,
                                header.correlation_id,
                                Bytes::from(e.to_string()),
                            ),
                        }
                    } else {
                        Frame::new_response(StatusCode::BadRequest, header.correlation_id, Bytes::from("Bad payload"))
                    }
                }
                Ok(CommandId::Get) => {
                    if let Ok(v) = serde_json::from_slice::<serde_json::Value>(payload_bytes) {
                        let key = v.get("key").and_then(|k| k.as_str()).unwrap_or("").as_bytes();
                        match self.storage.get(key).await {
                            Ok(Some(val)) => {
                                let val_str = String::from_utf8_lossy(&val);
                                Frame::new_response(
                                    StatusCode::Ok,
                                    header.correlation_id,
                                    Bytes::from(format!("{{\"key\":{},\"value\":{}}}",
                                        serde_json::to_string(v.get("key").unwrap().as_str().unwrap()).unwrap(),
                                        serde_json::to_string(&val_str.to_string()).unwrap())),
                                )
                            }
                            Ok(None) => Frame::new_response(StatusCode::NotFound, header.correlation_id, Bytes::from("Key not found")),
                            Err(e) => Frame::new_response(StatusCode::ServerError, header.correlation_id, Bytes::from(e.to_string())),
                        }
                    } else {
                        Frame::new_response(StatusCode::BadRequest, header.correlation_id, Bytes::from("Bad payload"))
                    }
                }
                Ok(CommandId::Del) => {
                    if let Ok(v) = serde_json::from_slice::<serde_json::Value>(payload_bytes) {
                        let key = v.get("key").and_then(|k| k.as_str()).unwrap_or("").as_bytes();
                        match self.storage.delete(key).await {
                            Ok(deleted) => Frame::new_response(
                                StatusCode::Ok,
                                header.correlation_id,
                                Bytes::from(format!("{{\"deleted\":{}}}", deleted)),
                            ),
                            Err(e) => Frame::new_response(StatusCode::ServerError, header.correlation_id, Bytes::from(e.to_string())),
                        }
                    } else {
                        Frame::new_response(StatusCode::BadRequest, header.correlation_id, Bytes::from("Bad payload"))
                    }
                }
                _ => Frame::new_response(StatusCode::BadRequest, header.correlation_id, Bytes::from("Unsupported command")),
            };

            socket.write_all(&resp.to_bytes()).await?;
        }

        self.metrics.dec_connections();
        Ok(())
    }
}

impl Clone for NexoraServer {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            storage: self.storage.clone(),
            cache: self.cache.clone(),
            queue: self.queue.clone(),
            events: self.events.clone(),
            scheduler: self.scheduler.clone(),
            workers: self.workers.clone(),
            auth: self.auth.clone(),
            metrics: self.metrics.clone(),
        }
    }
}
