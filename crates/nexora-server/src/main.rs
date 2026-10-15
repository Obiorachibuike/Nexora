use clap::Parser;
use nexora_core::ServerConfig;
use nexora_server::NexoraServer;
use std::path::PathBuf;
use tracing::info;

#[derive(Parser, Debug)]
#[command(name = "nexora-server", about = "Nexora Infrastructure Engine")]
struct Args {
    #[arg(short, long, default_value = "127.0.0.1")]
    bind: String,

    #[arg(short, long, default_value_t = 6380)]
    port: u16,

    #[arg(long, default_value_t = 6381)]
    http_port: u16,

    #[arg(long, default_value = "./data")]
    data_dir: PathBuf,

    #[arg(long)]
    api_key: Option<String>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    let args = Args::parse();

    let mut config = ServerConfig::default();
    config.bind_addr = args.bind;
    config.tcp_port = args.port;
    config.http_port = args.http_port;
    config.storage.data_dir = args.data_dir;
    config.api_key = args.api_key;

    info!("Starting Nexora engine v0.1.0...");
    let server = NexoraServer::new(config)?;
    server.run().await?;
    Ok(())
}
