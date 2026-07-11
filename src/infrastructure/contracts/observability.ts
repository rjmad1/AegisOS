// ============================================================================
// Observability Contracts — Architecture Interfaces Only
// ============================================================================

/**
 * Interface representing a metric recorder for tracking platform telemetry.
 */
export interface IMetricsRegistry {
  incrementCounter(name: string, tags?: Record<string, string>): void;
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
  recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
}

/**
 * Interface for distributed tracing and span management.
 */
export interface ISpan {
  id: string;
  name: string;
  context(): ITraceContext;
  setAttribute(key: string, value: any): void;
  end(): void;
}

export interface ITraceContext {
  traceId: string;
  spanId: string;
  traceFlags?: number;
}

export interface ITracer {
  startSpan(name: string, parentContext?: ITraceContext): ISpan;
  getActiveContext(): ITraceContext | null;
}

/**
 * Interface for structured logs to collect context-rich audit records.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface IStructuredLogger {
  log(level: LogLevel, message: string, context?: Record<string, any>): void;
  trace(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, error?: Error, context?: Record<string, any>): void;
}

/**
 * Interface for distributed event publishers and subscribers.
 */
export interface IDistributedEvent {
  id: string;
  name: string;
  payload: any;
  timestamp: number;
}

export interface IDistributedEventPublisher {
  publish(event: IDistributedEvent): Promise<void>;
}

export interface IDistributedEventSubscriber {
  subscribe(eventName: string, handler: (event: IDistributedEvent) => void | Promise<void>): Promise<() => void>;
}

/**
 * Interface for hardware performance counters and CPU/memory profiling.
 */
export interface IPerformanceCounter {
  name: string;
  value: number;
  unit: string;
}

export interface IPerformanceRegistry {
  registerCounter(name: string, unit: string): void;
  updateCounter(name: string, value: number): void;
  getCounter(name: string): IPerformanceCounter | null;
}

/**
 * Interface for diagnostics, anomalies, and platform failures.
 */
export interface IDiagnosticEvent {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface IDiagnosticRegistry {
  reportAnomaly(event: IDiagnosticEvent): void;
  getAnomalies(since?: number): IDiagnosticEvent[];
}
