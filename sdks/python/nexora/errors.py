class NexoraError(Exception):
    """Base exception for all Nexora client operations."""
    def __init__(self, message: str, code: str = "NEXORA_ERROR"):
        super().__init__(message)
        self.code = code

class AuthenticationError(NexoraError):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTHENTICATION_ERROR")

class NotFoundError(NexoraError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, "NOT_FOUND")

class LeaseExpiredError(NexoraError):
    def __init__(self, message: str = "Worker lease expired"):
        super().__init__(message, "LEASE_EXPIRED")

class ConnectionError(NexoraError):
    def __init__(self, message: str = "Failed to connect to Nexora server"):
        super().__init__(message, "CONNECTION_ERROR")
