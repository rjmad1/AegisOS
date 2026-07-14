// src/infrastructure/observability/structured-logger.ts
// Enterprise Structured JSON Logger with Tracing Context correlation

export type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS" | "DEBUG";

export interface LogStructure {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  traceId?: string;
  spanId?: string;
  correlationId?: string;
  workflowId?: string;
  userId?: string;
  module?: string;
  component?: string;
  version: string;
  environment: string;
  host: string;
  container?: string;
  error?: {
    code?: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

export class StructuredLogger {
  private serviceName: string;
  private environment: string;
  private host: string;
  private version: string;

  constructor(serviceName: string = "aegisos-console") {
    this.serviceName = serviceName;
    this.environment = process.env.NODE_ENV || "development";
    this.host = typeof process !== "undefined" ? process.env.COMPUTERNAME || process.env.HOSTNAME || "localhost" : "localhost";
    this.version = "1.0.0";
  }

  private write(level: LogLevel, message: string, metadata?: Record<string, any>, errorObj?: any) {
    const logEntry: LogStructure = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      host: this.host,
      metadata: {},
    };

    // Inject active trace context headers
    if (metadata) {
      const { traceId, spanId, correlationId, workflowId, userId, module, component, ...rest } = metadata;
      
      if (traceId) logEntry.traceId = traceId;
      if (spanId) logEntry.spanId = spanId;
      if (correlationId) logEntry.correlationId = correlationId;
      if (workflowId) logEntry.workflowId = workflowId;
      if (userId) logEntry.userId = userId;
      if (module) logEntry.module = module;
      if (component) logEntry.component = component;
      
      logEntry.metadata = rest;
    }

    if (errorObj) {
      logEntry.error = {
        code: errorObj.code || errorObj.name || "Error",
        message: errorObj.message || String(errorObj),
        stack: errorObj.stack,
      };
    }

    // Output formatted JSON to stdout/stderr
    const jsonString = JSON.stringify(logEntry);
    if (level === "ERROR") {
      console.error(jsonString);
    } else {
      console.log(jsonString);
    }
  }

  public info(message: string, metadata?: Record<string, any>) {
    this.write("INFO", message, metadata);
  }

  public debug(message: string, metadata?: Record<string, any>) {
    this.write("DEBUG", message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>) {
    this.write("WARN", message, metadata);
  }

  public success(message: string, metadata?: Record<string, any>) {
    this.write("SUCCESS", message, metadata);
  }

  public error(message: string, errorObj?: any, metadata?: Record<string, any>) {
    this.write("ERROR", message, metadata, errorObj);
  }
}

export const logger = new StructuredLogger();
export default logger;
