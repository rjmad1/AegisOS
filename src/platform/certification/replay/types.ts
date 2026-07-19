import { CertificationStatus } from '../types';

export interface WorkloadCapture {
  id: string;
  workloadId: string;
  timestamp: string;
  version: string;
  inputs: Record<string, any>;
  stateTransitions: Array<{
    step: string;
    timestamp: string;
    stateSnapshot: Record<string, any>;
  }>;
  outputs: Record<string, any>;
  traces: string[];
}

export interface ReplayComparison {
  originalCaptureId: string;
  replayCaptureId: string;
  timestamp: string;
  divergenceDetected: boolean;
  driftPercentage: number;
  divergedSteps: string[];
  status: CertificationStatus;
}
