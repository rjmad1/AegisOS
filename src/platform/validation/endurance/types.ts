/**
 * Endurance Validation Types
 * 
 * Declares declarative Endurance Profiles, workload mix ratios, 
 * burst events, and recovery expectations.
 */

import type { ValidationResult, ValidationStatus } from '../types';

export interface WorkloadMix {
  reasoningPercentage: number;
  workflowPercentage: number;
  capabilityPercentage: number;
  knowledgePercentage: number;
  participantPercentage: number;
  idlePercentage: number;
}

export interface BurstEvent {
  name: string;
  triggerIntervalMinutes: number;
  intensityMultiplier: number;
}

export interface EnduranceProfile {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  samplingIntervalSeconds: number;
  workloadMix: WorkloadMix;
  burstEvents: BurstEvent[];
  chaosInjections?: string[]; // References to ChaosSpec IDs
  allowedMemoryGrowthPerHourMB: number;
  allowedCpuPercentMax: number;
}

export interface EnduranceResult extends ValidationResult {
  profileId: string;
  durationActualMinutes: number;
  leakDetected: boolean;
  stabilityScore: number;
}

export interface IEnduranceProvider {
  readonly providerId: string;
  executeWorkload(mix: WorkloadMix, durationMinutes: number): Promise<boolean>;
}
