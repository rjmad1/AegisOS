// ============================================================================
// PIAL Types — Platform Intelligence & Autonomy Layer
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
