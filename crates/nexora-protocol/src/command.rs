use serde::{Deserialize, Serialize};

pub const MAGIC_BYTES: &[u8; 4] = b"NEXO";
pub const PROTOCOL_VERSION: u8 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
#[repr(u8)]
pub enum MessageType {
    Request = 1,
    Response = 2,
    Ping = 3,
    Pong = 4,
}

impl TryFrom<u8> for MessageType {
    type Error = &'static str;
    fn try_from(v: u8) -> Result<Self, Self::Error> {
        match v {
            1 => Ok(MessageType::Request),
            2 => Ok(MessageType::Response),
            3 => Ok(MessageType::Ping),
            4 => Ok(MessageType::Pong),
            _ => Err("Invalid message type"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[repr(u16)]
pub enum CommandId {
    Auth = 0x0001,
    Ping = 0x0002,
    Info = 0x0003,

    Set = 0x0010,
    Get = 0x0011,
    Del = 0x0012,
    Exists = 0x0013,
    Expire = 0x0014,
    Ttl = 0x0015,
    SetNx = 0x0016,
    Cas = 0x0017,
    Incr = 0x0018,
    Decr = 0x0019,
    Keys = 0x001A,

    QueueAdd = 0x0020,
    QueueFetch = 0x0021,
    QueueAck = 0x0022,
    QueueFail = 0x0023,
    QueueInspect = 0x0024,
    QueueCancel = 0x0025,
    QueueRetry = 0x0026,
    QueueList = 0x0027,

    EventPublish = 0x0030,
    EventSubscribe = 0x0031,
    EventAck = 0x0032,

    ScheduleAdd = 0x0040,
    ScheduleList = 0x0041,
    ScheduleCancel = 0x0042,
}

impl TryFrom<u16> for CommandId {
    type Error = &'static str;
    fn try_from(v: u16) -> Result<Self, Self::Error> {
        match v {
            0x0001 => Ok(CommandId::Auth),
            0x0002 => Ok(CommandId::Ping),
            0x0003 => Ok(CommandId::Info),
            0x0010 => Ok(CommandId::Set),
            0x0011 => Ok(CommandId::Get),
            0x0012 => Ok(CommandId::Del),
            0x0013 => Ok(CommandId::Exists),
            0x0014 => Ok(CommandId::Expire),
            0x0015 => Ok(CommandId::Ttl),
            0x0016 => Ok(CommandId::SetNx),
            0x0017 => Ok(CommandId::Cas),
            0x0018 => Ok(CommandId::Incr),
            0x0019 => Ok(CommandId::Decr),
            0x001A => Ok(CommandId::Keys),
            0x0020 => Ok(CommandId::QueueAdd),
            0x0021 => Ok(CommandId::QueueFetch),
            0x0022 => Ok(CommandId::QueueAck),
            0x0023 => Ok(CommandId::QueueFail),
            0x0024 => Ok(CommandId::QueueInspect),
            0x0025 => Ok(CommandId::QueueCancel),
            0x0026 => Ok(CommandId::QueueRetry),
            0x0027 => Ok(CommandId::QueueList),
            0x0030 => Ok(CommandId::EventPublish),
            0x0031 => Ok(CommandId::EventSubscribe),
            0x0032 => Ok(CommandId::EventAck),
            0x0040 => Ok(CommandId::ScheduleAdd),
            0x0041 => Ok(CommandId::ScheduleList),
            0x0042 => Ok(CommandId::ScheduleCancel),
            _ => Err("Unknown command ID"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u16)]
pub enum StatusCode {
    Ok = 0x0000,
    Created = 0x0001,
    NotFound = 0x0002,
    Unauthorized = 0x0003,
    BadRequest = 0x0004,
    Conflict = 0x0005,
    ServerError = 0x0006,
    LeaseExpired = 0x0007,
    RateLimited = 0x0008,
    Timeout = 0x0009,
}

impl TryFrom<u16> for StatusCode {
    type Error = &'static str;
    fn try_from(v: u16) -> Result<Self, Self::Error> {
        match v {
            0x0000 => Ok(StatusCode::Ok),
            0x0001 => Ok(StatusCode::Created),
            0x0002 => Ok(StatusCode::NotFound),
            0x0003 => Ok(StatusCode::Unauthorized),
            0x0004 => Ok(StatusCode::BadRequest),
            0x0005 => Ok(StatusCode::Conflict),
            0x0006 => Ok(StatusCode::ServerError),
            0x0007 => Ok(StatusCode::LeaseExpired),
            0x0008 => Ok(StatusCode::RateLimited),
            0x0009 => Ok(StatusCode::Timeout),
            _ => Err("Unknown status code"),
        }
    }
}
