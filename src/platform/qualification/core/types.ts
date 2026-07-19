import type { ValidationDomain, ValidationResult, ValidationStatus } from '../../validation/types';
import type { PlatformHealthIndex, ReleaseManifest } from '../types';

export type TriggerSource = 'EVENT' | 'SCHEDULE' | 'LIFECYCLE' | 'MANUAL';

export interface QualificationRequest {
  id: string;
  reason: string;
  triggerSource: TriggerSource;
  timestamp: string;
  scope?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  correlationId: string;
  providerSelection?: string[]; // IDs of specific providers to execute
}

export interface PlatformMaturityIndex {
  architecture: number;
  engineering: number;
  reliability: number;
  scalability: number;
  security: number;
  governance: number;
  observability: number;
  performance: number;
  maintainability: number;
  extensibility: number;
  aiReadiness: number;
  overall: number;
}

export interface RemediationRecommendation {
  problemId: string;
  domain: ValidationDomain;
  probableRootCause: string;
  estimatedImpact: string;
  remediationSteps: string[];
  estimatedEffortMinutes: number;
  confidenceScore: number; // 0.0 to 1.0
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
}

export interface QualificationReport {
  id: string;
  timestamp: string;
  request: QualificationRequest;
  decision: 'PASS' | 'WARNING' | 'FAIL';
  overallScore: number;
  durationMs: number;
  gitSha: string;
  platformVersion: string;
  environment: string;
  evidenceGraphRootHash: string;
  results: Record<string, ValidationResult>;
  maturity: PlatformMaturityIndex;
  remediations: RemediationRecommendation[];
  warnings: string[];
  manifest?: ReleaseManifest;
}

export interface IQualificationProvider {
  readonly providerId: string;
  readonly supportedDomains: ValidationDomain[];
  readonly dependencies: string[]; // Other provider IDs that must run first
  execute(request: QualificationRequest): Promise<ValidationResult>;
}
