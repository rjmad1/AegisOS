// ============================================================================
// PIK Types — Platform Intelligence Kernel
// ============================================================================

export type RiskLevel = 0 | 1 | 2 | 3 | 4;

export const RiskLevels = {
  /** Read-only observations. Always autonomous. */
  LEVEL_0_OBSERVATION: 0 as RiskLevel,
  /** Reversible maintenance. Autonomous if policy permits. */
  LEVEL_1_MAINTENANCE: 1 as RiskLevel,
  /** Configuration modifications. Require organizational policy approval. */
  LEVEL_2_CONFIGURATION: 2 as RiskLevel,
  /** Behavioral modifications. Require human approval. */
  LEVEL_3_BEHAVIORAL: 3 as RiskLevel,
  /** Architecture modifications. Never autonomous (Requires ADR and code review). */
  LEVEL_4_ARCHITECTURAL: 4 as RiskLevel,
};

export type ActionCategory = 
  | 'CacheCleanup'
  | 'CapabilityUnload'
  | 'KnowledgeReindex'
  | 'DescriptorRecompile'
  | 'WorkflowCleanup'
  | 'ModelCacheRefresh'
  | 'ResourceRebalancing'
  | 'DependencyUpdate'
  | 'ArchitectureRefactor'
  | 'PolicyUpdate'
  | 'CapabilityOptimization'
  | 'WorkflowOptimization'
  | 'ModelOptimization'
  | 'KnowledgeOptimization'
  | 'MemoryOptimization'
  | 'ParticipantOptimization'
  | 'GovernanceOptimization'
  | 'ResourceOptimization';

export interface OptimizationRecommendation {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  riskLevel: RiskLevel;
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

export interface OptimizationExecutionResult {
  recommendationId: string;
  success: boolean;
  executedAutonomous: boolean;
  message?: string;
  timestamp: number;
}

// ============================================================================
// Platform Intelligence Kernel (PIK) Evolution Types
// ============================================================================

export interface EngineeringRequest {
  id: string;
  type: 'file_modification' | 'intent' | 'configuration' | 'migration';
  intent: string;
  origin: 'user' | 'agent' | 'system';
  entities: string[]; // Resolved EKG entity IDs
  riskProfile: {
    architectural: number;
    operational: number;
    security: number;
    governance: number;
    performance: number;
    overall: number;
  };
  executionPlan: {
    tasks: string[];
    requiredTests: string[];
    requiredDocs: string[];
    rollbackPayload: string;
  };
  status: 'PENDING' | 'SIMULATING' | 'APPROVED' | 'EXECUTED' | 'FAILED';
  createdAt: string;
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
  relatedArtifacts: string[]; // IDs of related artifacts or capabilities
  introducedVersion: string;
  timestamp: string;
}

