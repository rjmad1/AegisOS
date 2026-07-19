/**
 * Chaos Engineering Type Definitions
 * 
 * Declares the ChaosSpec models, steps, fault providers, and recovery objectives (RTO/RPO).
 */

import type { ValidationResult, ValidationStatus } from '../types';

export type ChaosTier = 'Tier-1' | 'Tier-2' | 'Tier-3' | 'Tier-4';

export type ChaosFaultCategory =
  | 'service_kill'
  | 'latency'
  | 'packet_loss'
  | 'db_failure'
  | 'resource_pressure'
  | 'data_corruption'
  | 'dependency_unavailability'
  | 'clock_skew'
  | 'partial_outage';

export interface RecoveryObjective {
  rtoSeconds: number; // Recovery Time Objective
  rpoSeconds: number; // Recovery Point Objective (data integrity)
}

export interface ChaosStep {
  providerId: string;
  action: string;
  target: string;
  parameters?: Record<string, any>;
  durationMs: number;
}

export interface ChaosSpec {
  id: string;
  version: string;
  name: string;
  description: string;
  tier: ChaosTier;
  category: ChaosFaultCategory;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetSubsystem: string;
  preconditions: {
    minimumHealthScore: number;
    requiredCapabilities: string[];
  };
  steps: ChaosStep[];
  recoveryObjective: RecoveryObjective;
  rollbackStrategy: {
    automatic: boolean;
    steps: ChaosStep[];
  };
}

export interface ChaosResult extends ValidationResult {
  specId: string;
  rtoActualMs?: number;
  rpoActualMs?: number;
  gracefulDegradationPassed: boolean;
  retryEffectivenessPassed: boolean;
  recoveredSuccessfully: boolean;
}

export interface IChaosFaultProvider {
  readonly providerId: string;
  readonly supportedCategories: ChaosFaultCategory[];
  inject(step: ChaosStep): Promise<boolean>;
  recover(step: ChaosStep): Promise<boolean>;
}
