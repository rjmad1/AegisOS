/**
 * Scalability & Capacity Types
 * 
 * Declares profiles, load providers, capacity envelopes, and metric reports.
 */

import type { ValidationResult } from '../types';

export type LoadProfileType = 'steady' | 'burst' | 'spike' | 'stress' | 'saturation' | 'recovery' | 'soak';

export interface ScalabilityProfile {
  id: string;
  name: string;
  description: string;
  maxTargetConcurrency: number;
  expectedThroughputP95: number;
  expectedLatencyLimitMs: number;
  hardwareCpuCores: number;
  hardwareMemoryMB: number;
}

export interface OperatingEnvelope {
  optimalConcurrency: number;
  saturationConcurrency: number;
  failureBoundaryConcurrency: number;
  bottleneckReason?: string;
}

export interface CapacityReport extends ValidationResult {
  profileId: string;
  envelope: OperatingEnvelope;
  concurrencyReached: number;
  throughputP95: number;
  latencyP95Ms: number;
}

export interface ILoadGenerator {
  readonly providerId: string;
  executeLoadRun(
    profileType: LoadProfileType,
    concurrency: number,
    durationMs: number
  ): Promise<{ throughput: number; avgLatencyMs: number; errorRate: number }>;
}
