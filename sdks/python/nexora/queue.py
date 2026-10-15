from typing import Any, Optional, Dict
from .protocol import CommandId

class NexoraQueue:
    def __init__(self, client, name: str = "default"):
        self._client = client
        self.name = name

    def add(
        self,
        job_name: str,
        payload: Any,
        priority: int = 5,
        delay_ms: int = 0,
        max_attempts: int = 3,
        dedup_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        resp = self._client.send_command(CommandId.QUEUE_ADD, {
            "queue": self.name,
            "name": job_name,
            "payload": payload,
            "priority": priority,
            "delay_ms": delay_ms,
            "max_attempts": max_attempts,
            "dedup_key": dedup_key,
        })
        return resp.get("job", {})

    def fetch_next(self, worker_id: str, lease_ms: int = 30000) -> Optional[Dict[str, Any]]:
        resp = self._client.send_command(CommandId.QUEUE_FETCH, {
            "queue": self.name,
            "worker_id": worker_id,
            "lease_ms": lease_ms,
        })
        return resp.get("job")

    def ack(self, job_id: str, worker_id: str, fencing_token: str) -> None:
        self._client.send_command(CommandId.QUEUE_ACK, {
            "job_id": job_id,
            "worker_id": worker_id,
            "fencing_token": fencing_token,
        })

    def fail(self, job_id: str, worker_id: str, fencing_token: str, error: str) -> None:
        self._client.send_command(CommandId.QUEUE_FAIL, {
            "job_id": job_id,
            "worker_id": worker_id,
            "fencing_token": fencing_token,
            "error": error,
        })

    def inspect(self, job_id: str) -> Optional[Dict[str, Any]]:
        resp = self._client.send_command(CommandId.QUEUE_INSPECT, {
            "job_id": job_id,
        })
        return resp.get("job")
