/**
 * Unified Observability Pipeline (UOP) Type Definitions
 * 
 * Collect once, correlate everywhere.
 * All metrics, logs, and traces are collected through this pipeline.
 */

export type TraceID = string;
export type ExecutionID = string;
export type BenchmarkID = string;

export interface TelemetryContext {
  traceId: TraceID;
  executionId?: ExecutionID;
  workflowId?: string;
  participantId?: string;
  capabilityId?: string;
  descriptorId?: string;
  modelId?: string;
  providerId?: string;
  projectId?: string;
  workspaceId?: string;
  benchmarkId?: BenchmarkID;
  timestamp: number;
}

export enum MetricType {
  GAUGE = 'GAUGE',
  COUNTER = 'COUNTER',
  HISTOGRAM = 'HISTOGRAM',
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  unit: string;
  context: TelemetryContext;
  labels: Record<string, string>;
}

export interface CollectorMetadata {
  id: string;
  name: string;
  version: string;
  collectionLatencyMs: number;
  collectionCost: number;
  samplingFrequencyHz: number;
  memoryOverheadBytes: number;
  cpuOverheadPercent: number;
}

export interface TelemetryCollector {
  getMetadata(): CollectorMetadata;
  collect(): Promise<Metric[]>;
}

export interface TelemetryPipeline {
  registerCollector(collector: TelemetryCollector): void;
  emit(metric: Metric): void;
  query(filter: Partial<TelemetryContext>): Promise<Metric[]>;
}
