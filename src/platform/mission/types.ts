// src/platform/mission/types.ts
// Canonical Domain Models for AegisOS Engineering Missions and Ecosystem

export type MissionLifecycleState =
  | 'REQUESTED'
  | 'DISCOVERED'
  | 'ANALYZED'
  | 'IMPACT_ASSESSED'
  | 'PLANNED'
  | 'SIMULATED'
  | 'QUALIFIED'
  | 'APPROVED'
  | 'EXECUTED'
  | 'VERIFIED'
  | 'DOCUMENTED'
  | 'MEMORY_UPDATED'
  | 'CLOSED';

export interface ExecutionPlan {
  tasks: string[];
  requiredTests: string[];
  requiredDocs: string[];
  rollbackPayload: string;
}

export interface RollbackPlan {
  action: 'GIT_REVERT' | 'RESTORE_SNAP' | 'CUSTOM';
  files?: string[];
  backupBranch?: string;
  snapshotVersion?: string;
  customPayload?: string;
}

export interface EngineeringMission {
  id: string;
  type: 'feature' | 'refactor' | 'bugfix' | 'modernization' | 'audit' | 'optimization' | 'self-healing';
  objective: string;
  origin: 'user' | 'agent' | 'system';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  businessValue: string;
  engineeringValue: string;
  risk: number; // 0-100
  confidence: number; // 0-100
  constraints: string[];
  affectedAssets: string[]; // CanonicalAsset IDs
  affectedCapabilities: string[]; // Capability IDs
  affectedProviders: string[]; // Provider IDs
  affectedDocumentation: string[]; // Document paths
  affectedADRs: string[]; // ADR IDs
  impactGraph: {
    nodes: string[];
    edges: Array<{ source: string; target: string; type: string }>;
  };
  simulationPlan: {
    sessionIds: string[];
    policiesToCheck: string[];
  };
  qualificationPlan: {
    gates: string[];
    minimumHealthScore: number;
  };
  executionPlan: ExecutionPlan;
  rollbackPlan: RollbackPlan;
  evidence: Record<string, {
    hash: string;
    timestamp: string;
    data: any;
  }>;
  approvalState: 'PENDING' | 'APPROVED' | 'REJECTED';
  lifecycleState: MissionLifecycleState;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalAsset {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  lineageId: string;
  version: string;
  owner: string;
  confidence: number;
  trustScore: number;
  sourceReferences: string[];
}

export interface TechnicalDebtItem {
  id: string;
  category: 'circular_dependency' | 'dead_code' | 'layer_violation' | 'duplication' | 'eroded_architecture' | 'doc_drift';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  probableRootCause: string;
  estimatedEffortMinutes: number;
  confidenceScore: number;
  status: 'OPEN' | 'RESOLVED' | 'IGNORED';
  remediationSteps: string[];
  evidence: string[];
}

export interface ArchitecturalMemory {
  id: string;
  title: string;
  category: 'decision' | 'lesson' | 'experiment';
  status: 'Draft' | 'Accepted' | 'Implemented' | 'Deprecated';
  decision: string;
  context: string;
  tradeOffs: string;
  consequences: string;
  relatedArtifacts: string[];
  introducedVersion: string;
  timestamp: string;
}

export interface KnowledgeEntity {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  lineageId?: string;
  version?: string;
  owner?: string;
  confidence?: number;
  trustScore?: number;
  sourceReferences?: string[];
}

export interface SimulationSession {
  id: string;
  parentSessionId: string | null;
  snapshotVersion: string;
  executionEngine: 'OVERLAY' | 'BRANCH' | 'SANDBOX';
  projectionScope: string[];
  deltaPayload: any;
  policiesChecked: string[];
  reasoningTrace: string;
  evidenceHash: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt: string | null;
}

export interface QualificationResult {
  id: string;
  name: string;
  domain: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
  score: number;
  durationMs: number;
  timestamp: string;
  evidence: {
    provenance: {
      traceId: string;
      executionId: string;
      gitSha: string;
      platformVersion: string;
      timestamp: string;
      generatorId: string;
      generatorVersion: string;
    };
    contentHash: string;
  };
  metrics?: Record<string, number>;
}

export interface EngineeringRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  riskLevel: number;
  confidence: number;
  supportingEvidence: string[];
  historicalFrequency: string;
  expectedBenefit: string;
  estimatedRisk: string;
  rollbackStrategy: string;
  constitutionalCompliance: boolean;
  autonomousEligibility: boolean;
  timestamp: number;
  sourceAnalyzer: string;
}

export interface PlatformFinding {
  id: string;
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  location: string;
  ruleId: string;
  timestamp: string;
}

export interface ChangeImpact {
  entities: string[];
  affectedComponents: string[];
  validatingTests: string[];
  documentingDocs: string[];
  governingADRs: string[];
  riskProfile: {
    architectural: number;
    operational: number;
    security: number;
    governance: number;
    performance: number;
    overall: number;
  };
  complexity: number;
  estimatedEffortMinutes: number;
  confidence: number;
}
