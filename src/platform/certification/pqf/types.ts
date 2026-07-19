import { ReleaseManifest } from '../types';
import { EvidenceCategory } from '../evidence-provider';

export type DeploymentEnvironment = 
  | 'DEVELOPMENT' 
  | 'WORKSTATION' 
  | 'TEAM_SERVER' 
  | 'ENTERPRISE_PRODUCTION';

export type QualificationStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface RequiredCapability {
  id: string;
  name: string;
  critical: boolean; // If missing, causes FAIL. If false and missing, causes WARNING.
}

export interface QualificationProfile {
  id: string;
  environment: DeploymentEnvironment;
  minimumHealthScore: number;
  requiredCapabilities: RequiredCapability[];
  requiredEvidenceCategories?: EvidenceCategory[];
}

export interface QualificationReport {
  timestamp: string;
  manifestVersion: string;
  profilesEvaluated: Record<string, {
    status: QualificationStatus;
    score: number;
    missingCapabilities: string[];
    missingEvidenceCategories?: EvidenceCategory[];
    warnings: string[];
  }>;
}

export interface QualificationGate {
  id: string;
  name: string;
  profileId: string;
  requiredEvidenceCategories: EvidenceCategory[];
}

