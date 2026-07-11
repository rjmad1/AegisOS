// ============================================================================
// Observability Foundation — Decoupled Telemetry Abstraction Interfaces
// ============================================================================

export type MetricValue = number | string | boolean;

export interface MetricTag {
  key: string;
  value: string;
}

export interface MetricDescriptor {
  name: string;
  description: string;
  unit?: string;
  tags?: MetricTag[];
}

export interface IMetricsCollector {
  /** Record counter value */
  counter(name: string, value: number, tags?: MetricTag[]): void;
  /** Record gauge (current value) */
  gauge(name: string, value: number, tags?: MetricTag[]): void;
  /** Record histogram or distribution */
  histogram(name: string, value: number, tags?: MetricTag[]): void;
  /** Register a custom metric descriptor */
  registerMetric(descriptor: MetricDescriptor): void;
}

export interface LogRecord {
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  timestampMs: number;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

export interface ILogExporter {
  /** Queue a log record for export */
  writeLog(record: LogRecord): void;
  /** Force logs flushing to storage */
  flush(): Promise<void>;
}

export interface TelemetryEvent {
  id: string;
  name: string;
  source: string;
  timestampMs: number;
  payload: Record<string, any>;
  correlationId?: string;
}

export interface ITelemetryEventBus {
  /** Publish telemetry event */
  publishEvent(event: TelemetryEvent): void;
  /** Subscribe to specific event namespaces */
  subscribe(eventName: string, callback: (event: TelemetryEvent) => void): () => void;
}

export interface PerformanceCounter {
  name: string;
  unit: string;
  getCurrentValue(): number | Promise<number>;
}

export interface IPerformanceRegistry {
  /** Register a dynamic system counter provider */
  registerCounter(counter: PerformanceCounter): void;
  /** Retrieve all active system performance counters */
  getCounters(): PerformanceCounter[];
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "error" | "critical";
  timestampMs: number;
  channel?: string;
  sent: boolean;
}

export interface INotificationChannel {
  id: string;
  name: string;
  /** Attempt delivery of notification to the endpoint */
  send(notification: Notification): Promise<boolean>;
}

export interface HealthIndicator {
  name: string;
  check(): Promise<{
    status: "up" | "down" | "degraded";
    message?: string;
    details?: Record<string, any>;
  }>;
}

export interface IHealthRegistry {
  /** Register a health check indicator */
  registerIndicator(indicator: HealthIndicator): void;
  /** Run all registered indicators */
  runChecks(): Promise<Record<string, any>>;
}

export interface IStreamingTelemetryManager {
  /** Connect websocket/SSE endpoint to stream metrics */
  initializeStream(channelId: string): void;
  /** Broadcast metrics payload to active streams */
  broadcastStream(payload: Record<string, any>): void;
}
