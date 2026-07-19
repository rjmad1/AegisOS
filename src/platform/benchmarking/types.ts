/**
 * Benchmarking Framework Type Definitions
 * 
 * Supports the Layered Benchmark Framework (LBF) and 
 * Multi-Tier Reasoning Benchmark Strategy (MRBS).
 */
import { TelemetryContext } from '../observability/types';

export enum BenchmarkTier {
  TIER_0 = 'TIER_0_PLATFORM_DETERMINISM',
  TIER_1 = 'TIER_1_RUNTIME_PERFORMANCE',
  TIER_2 = 'TIER_2_PRODUCTION_PROVIDERS',
  TIER_3 = 'TIER_3_COGNITIVE_QUALITY',
  TIER_4 = 'TIER_4_ADAPTIVE_LEARNING'
}

export interface BenchmarkProvenanceManifest {
  id: string;
  gitCommit: string;
  architectureVersion: string;
  benchmarkTier: BenchmarkTier;
  benchmarkSuite: string;
  benchmarkSeed?: number;
  benchmarkDataset?: string;
  
  platform: {
    cpu: string;
    gpu: string;
    ram: string;
    os: string;
    node: string;
  };

  runtime: {
    provider: string;
    model: string;
    temperature: number;
    topP?: number;
    maxTokens?: number;
    context: number;
  };

  telemetry: {
    latency: number;
    throughput: number;
    memory: number;
    vram: number;
    cost: number;
    energy: number;
  };

  environmentHash: string;
  descriptorHash: string;
  workflowHash: string;
  timestamp: number;
}


