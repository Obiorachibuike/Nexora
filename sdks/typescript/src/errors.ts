export class NexoraError extends Error {
  constructor(message: string, public code: string = 'NEXORA_ERROR') {
    super(message);
    this.name = 'NexoraError';
  }
}

export class AuthenticationError extends NexoraError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends NexoraError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class LeaseExpiredError extends NexoraError {
  constructor(message: string = 'Job lease expired') {
    super(message, 'LEASE_EXPIRED');
    this.name = 'LeaseExpiredError';
  }
}

export class ConnectionError extends NexoraError {
  constructor(message: string = 'Failed to connect to Nexora server') {
    super(message, 'CONNECTION_ERROR');
    this.name = 'ConnectionError';
  }
}
