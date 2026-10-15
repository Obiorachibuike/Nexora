import socket
import json
from typing import Optional, Dict, Any
from .protocol import (
    HEADER_LEN,
    MessageType,
    CommandId,
    StatusCode,
    encode_frame,
    decode_header,
)
from .errors import (
    NexoraError,
    AuthenticationError,
    NotFoundError,
    LeaseExpiredError,
    ConnectionError,
)
from .store import NexoraStore
from .queue import NexoraQueue

class NexoraClient:
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 6380,
        api_key: Optional[str] = None,
        timeout: float = 5.0,
    ):
        self.host = host
        self.port = port
        self.api_key = api_key
        self.timeout = timeout
        self._sock: Optional[socket.socket] = None
        self._correlation_id = 1

    def connect(self) -> None:
        if self._sock is not None:
            return
        try:
            self._sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self._sock.settimeout(self.timeout)
            self._sock.connect((self.host, self.port))
            if self.api_key:
                self.authenticate(self.api_key)
        except Exception as e:
            self._sock = None
            raise ConnectionError(f"Cannot connect to {self.host}:{self.port} - {e}")

    def authenticate(self, api_key: str) -> None:
        self.send_command(CommandId.AUTH, {"api_key": api_key})

    def ping(self) -> bool:
        resp = self.send_command(CommandId.PING, {})
        return bool(resp.get("pong", False))

    def send_command(self, command_id: int, payload: Dict[str, Any]) -> Dict[str, Any]:
        if self._sock is None:
            self.connect()

        cid = self._correlation_id
        self._correlation_id += 1
        payload_bytes = json.dumps(payload).encode("utf-8")
        frame = encode_frame(MessageType.REQUEST, command_id, cid, payload_bytes)

        self._sock.sendall(frame)

        # Read header
        header_buf = bytearray()
        while len(header_buf) < HEADER_LEN:
            chunk = self._sock.recv(HEADER_LEN - len(header_buf))
            if not chunk:
                raise ConnectionError("Connection closed unexpectedly by server")
            header_buf.extend(chunk)

        version, msg_type, flags, resp_cid, status_code, payload_len = decode_header(bytes(header_buf))

        # Read payload
        payload_buf = bytearray()
        while len(payload_buf) < payload_len:
            chunk = self._sock.recv(payload_len - len(payload_buf))
            if not chunk:
                raise ConnectionError("Connection closed unexpectedly by server")
            payload_buf.extend(chunk)

        result = {}
        if payload_len > 0:
            try:
                result = json.loads(payload_buf.decode("utf-8"))
            except Exception:
                result = {"raw": bytes(payload_buf)}

        if status_code in (StatusCode.OK, StatusCode.CREATED):
            return result
        elif status_code == StatusCode.NOT_FOUND:
            raise NotFoundError(result.get("error", "Not found"))
        elif status_code == StatusCode.UNAUTHORIZED:
            raise AuthenticationError(result.get("error", "Unauthorized"))
        elif status_code == StatusCode.LEASE_EXPIRED:
            raise LeaseExpiredError(result.get("error", "Lease expired"))
        else:
            raise NexoraError(result.get("error", f"Error status {status_code}"))

    def store(self) -> NexoraStore:
        return NexoraStore(self)

    def queue(self, name: str = "default") -> NexoraQueue:
        return NexoraQueue(self, name)

    def close(self) -> None:
        if self._sock is not None:
            try:
                self._sock.close()
            except Exception:
                pass
            self._sock = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
