// src/utils/errors.ts
// Centralized Exception Hierarchy for the AegisOS Platform

export class PlatformError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly correlationId: string;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code = "INTERNAL_SERVER_ERROR",
    statusCode = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.correlationId = `err-${Math.random().toString(36).substring(2, 8)}`;
    this.timestamp = new Date().toISOString();
    this.context = context;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends PlatformError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, context);
  }
}

export class NotFoundError extends PlatformError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NOT_FOUND_ERROR", 404, context);
  }
}

export class SecurityError extends PlatformError {
  constructor(message: string, code = "UNAUTHORIZED_ERROR", statusCode = 401, context?: Record<string, unknown>) {
    super(message, code, statusCode, context);
  }
}

export class ConflictError extends PlatformError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONFLICT_ERROR", 409, context);
  }
}

export class InternalServerError extends PlatformError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "INTERNAL_SERVER_ERROR", 500, context);
  }
}
