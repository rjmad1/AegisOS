import type { ValidationDomain, ValidationResult, ValidationStatus } from '../../validation/types';
import type { PlatformHealthIndex, ReleaseManifest } from '../../certification/types';

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
  oeid?: string;
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
  pri?: number;
  kmm?: number;
  gcm?: number;
  cerExceptionsCount?: number;
}

export interface ReleaseReadinessIndex {
  ori: number;
  confidenceScore: number;
  releaseCandidate: boolean;
  evidenceScore: number;
  certificationStatus: string;
}

export interface PlatformAssessment {
  maturity: PlatformMaturityIndex;
  releaseReadiness: ReleaseReadinessIndex;
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

export interface PlatformMaturity {
  overall: number;
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
}

export interface QualificationReport {
  id: string;
  timestamp: string;
  request: QualificationRequest;
  decision: 'PASS' | 'WARNING' | 'FAIL';
  overallScore: number;
  durationMs: number;
  gitSha: string;
  oeid?: string;
  platformVersion: string;
  environment: string;
  evidenceGraphRootHash: string;
  results: Record<string, ValidationResult>;
  assessment: PlatformAssessment;
  remediations: RemediationRecommendation[];
  warnings: string[];
  manifest?: ReleaseManifest;
  maturity: PlatformMaturity;
}

export interface IQualificationProvider {
  readonly providerId: string;
  readonly supportedDomains: ValidationDomain[];
  readonly dependencies: string[]; // Other provider IDs that must run first
  execute(request: QualificationRequest): Promise<ValidationResult>;
}
