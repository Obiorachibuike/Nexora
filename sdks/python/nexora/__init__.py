"""
Nexora Python Client Library
Official SDK for connecting to the Nexora independent infrastructure engine.
"""

from .client import NexoraClient
from .store import NexoraStore
from .queue import NexoraQueue
from .errors import (
    NexoraError,
    AuthenticationError,
    NotFoundError,
    LeaseExpiredError,
    ConnectionError,
)

__all__ = [
    "NexoraClient",
    "NexoraStore",
    "NexoraQueue",
    "NexoraError",
    "AuthenticationError",
    "NotFoundError",
    "LeaseExpiredError",
    "ConnectionError",
]

__version__ = "0.1.0"
