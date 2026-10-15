from typing import Any, Optional, List
from .protocol import CommandId
from .errors import NotFoundError

class NexoraStore:
    def __init__(self, client):
        self._client = client

    def set(self, key: str, value: Any, ttl_ms: Optional[int] = None) -> None:
        self._client.send_command(CommandId.SET, {
            "key": key,
            "value": value,
            "ttl_ms": ttl_ms
        })

    def get(self, key: str) -> Optional[Any]:
        try:
            resp = self._client.send_command(CommandId.GET, {"key": key})
            return resp.get("value")
        except NotFoundError:
            return None

    def delete(self, key: str) -> bool:
        resp = self._client.send_command(CommandId.DEL, {"key": key})
        return bool(resp.get("deleted", False))

    def exists(self, key: str) -> bool:
        resp = self._client.send_command(CommandId.EXISTS, {"key": key})
        return bool(resp.get("exists", False))

    def expire(self, key: str, ttl_ms: int) -> bool:
        resp = self._client.send_command(CommandId.EXPIRE, {"key": key, "ttl_ms": ttl_ms})
        return bool(resp.get("updated", False))

    def ttl(self, key: str) -> Optional[int]:
        try:
            resp = self._client.send_command(CommandId.TTL, {"key": key})
            return resp.get("ttl_ms")
        except NotFoundError:
            return None

    def set_nx(self, key: str, value: Any, ttl_ms: Optional[int] = None) -> bool:
        resp = self._client.send_command(CommandId.SET_NX, {
            "key": key,
            "value": value,
            "ttl_ms": ttl_ms
        })
        return bool(resp.get("success", False))

    def cas(self, key: str, expected: Any, value: Any, ttl_ms: Optional[int] = None) -> bool:
        resp = self._client.send_command(CommandId.CAS, {
            "key": key,
            "expected": expected,
            "value": value,
            "ttl_ms": ttl_ms
        })
        return bool(resp.get("success", False))

    def incr(self, key: str, delta: int = 1) -> int:
        resp = self._client.send_command(CommandId.INCR, {"key": key, "delta": delta})
        return int(resp.get("value", 0))

    def keys(self, prefix: Optional[str] = None) -> List[str]:
        resp = self._client.send_command(CommandId.KEYS, {"prefix": prefix})
        return resp.get("keys", [])
