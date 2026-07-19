/**
 * Benchmark Execution Context
 * 
 * Every benchmark receives this exact context to ensure uniform provenance.
 */
import { BenchmarkTier } from './types';
import { TraceID, ExecutionID } from '../observability/types';

export interface BenchmarkExecutionContext {
  benchmarkId: string;
  traceId: TraceID;
  executionId: ExecutionID;
  benchmarkTier: BenchmarkTier;
  scenarioId?: string;
  
  hardwareProfile: {
    cpu: string;
    gpu: string;
    ram: string;
    os: string;
    nodeVersion: string;
  };

  hashes: {
    configurationHash: string;
    descriptorHash: string;
    workflowHash: string;
  };

  versioning: {
    gitCommit: string;
    platformVersion: string;
    architectureVersion: string;
    nfrVersion: string;
    performanceContractVersion: string;
  };

  timestamp: number;
}
