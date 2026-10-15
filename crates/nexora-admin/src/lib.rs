use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use nexora_metrics::NexoraMetrics;
use nexora_storage::AofEngine;
use serde_json::{json, Value};
use std::sync::Arc;

#[derive(Clone)]
pub struct AdminState {
    pub metrics: Arc<NexoraMetrics>,
    pub storage: Arc<AofEngine>,
}

pub fn create_admin_router(state: AdminState) -> Router {
    Router::new()
        .route("/health", get(health_handler))
        .route("/ready", get(ready_handler))
        .route("/metrics", get(metrics_handler))
        .route("/api/v1/stats", get(stats_handler))
        .with_state(state)
}

async fn health_handler() -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "status": "healthy",
            "version": "0.1.0",
            "engine": "Nexora"
        })),
    )
}

async fn ready_handler() -> (StatusCode, Json<Value>) {
    (
        StatusCode::OK,
        Json(json!({
            "ready": true,
            "storage": "connected"
        })),
    )
}

async fn metrics_handler(State(state): State<AdminState>) -> (StatusCode, Json<Value>) {
    let snap = state.metrics.snapshot();
    (StatusCode::OK, Json(json!(snap)))
}

async fn stats_handler(State(state): State<AdminState>) -> (StatusCode, Json<Value>) {
    let snap = state.metrics.snapshot();
    (
        StatusCode::OK,
        Json(json!({
            "server": "Nexora/0.1.0",
            "protocol": "NBP/1.0",
            "metrics": snap
        })),
    )
}
