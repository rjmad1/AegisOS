// ============================================================================
// Collective Intelligence Layer (CIL) — Core Types & Contracts
// ============================================================================

/**
 * The Confidence Framework: Every major cognitive artifact shall include these metrics.
 */
export interface ConfidenceMetrics {
  confidenceScore: number;       // 0.0 to 1.0
  reasoningCompleteness: number; // 0.0 to 1.0
  evidenceCoverage: number;      // 0.0 to 1.0
  uncertaintyLevel: "low" | "medium" | "high" | "critical";
  riskLevel: "low" | "medium" | "high" | "critical";
  assumptionCount: number;
  informationGaps: string[];
}

/**
 * Base interface for all artifacts produced by the Collective Intelligence Layer.
 */
export interface CognitiveArtifact {
  id: string;
  type: string;
  createdAt: string;
  createdBy: string; // The service or agent ID that generated this
  confidence: ConfidenceMetrics;
}

// ---------------------------------------------------------------------------
// Deliberation Service Types
// ---------------------------------------------------------------------------

export type ReasoningStrategyType = 
  | "chain_of_thought"
  | "tree_of_thought"
  | "graph_of_thought"
  | "hypothesis_generation"
  | "constraint_satisfaction"
  | "decision_matrix"
  | "rule_based";

export interface DeliberationContext {
  objective: string;
  constraints?: string[];
  priorKnowledge?: string[];
}

export interface DeliberationResult extends CognitiveArtifact {
  type: "deliberation_result";
  strategyUsed: ReasoningStrategyType;
  conclusion: string;
  reasoningTrace: string[];
  alternativesConsidered?: string[];
}

// ---------------------------------------------------------------------------
// Critique Service Types
// ---------------------------------------------------------------------------

export interface CritiqueRequest {
  planId: string;
  planContent: any; // e.g. ExecutionPlan from ai-runtime
  context?: Record<string, any>;
}

export interface CritiqueIssue {
  type: "risk" | "missing_dependency" | "hallucination" | "constraint_violation" | "policy_violation" | "logic_flaw";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  suggestedFix?: string;
}

export interface CritiqueResult extends CognitiveArtifact {
  type: "critique_result";
  planId: string;
  approved: boolean;
  issuesFound: CritiqueIssue[];
  overallRisk: "low" | "medium" | "high" | "critical";
}

// ---------------------------------------------------------------------------
// Consensus Service Types
// ---------------------------------------------------------------------------

export type ConsensusMethod =
  | "majority_vote"
  | "weighted_vote"
  | "confidence_weighting"
  | "expert_selection"
  | "hierarchical_review"
  | "llm_council"
  | "human_arbitration";

export interface ConsensusProposal {
  proposerId: string;
  proposalContent: any;
  confidenceScore: number; // 0.0 to 1.0
  expertiseWeight?: number; // 1.0 default
}

export interface ConsensusOutcome extends CognitiveArtifact {
  type: "consensus_outcome";
  methodUsed: ConsensusMethod;
  winningProposalId: string;
  agreementScore: number; // 0.0 to 1.0 (How unified was the decision)
  dissentingOpinions?: string[];
  rationale: string;
}

// ---------------------------------------------------------------------------
// Reflection Service Types
// ---------------------------------------------------------------------------

export interface ReflectionRequest {
  workflowId: string;
  expectedOutcome: string;
  actualOutcome: string;
  executionLogs: string[];
  success: boolean;
}

export interface ReusableLesson {
  id: string;
  contextPattern: string;
  actionTaken: string;
  outcome: string;
  lessonLearned: string;
  applicability: string[]; // tags or conditions
}

export interface ReflectionResult extends CognitiveArtifact {
  type: "reflection_result";
  workflowId: string;
  mistakesIdentified: string[];
  successfulStrategies: string[];
  lessonsGenerated: ReusableLesson[];
}

// ---------------------------------------------------------------------------
// Strategy Library Types
// ---------------------------------------------------------------------------

export interface ReusableStrategy {
  id: string;
  name: string;
  description: string;
  domain: "research" | "coding" | "debugging" | "planning" | "document_analysis" | "architecture_review" | "migration" | "general";
  steps: string[];
  successRate?: number;
  usageCount?: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Skill Recommendation Service Types
// ---------------------------------------------------------------------------

export interface SkillRecommendation extends CognitiveArtifact {
  type: "skill_recommendation";
  objective: string;
  recommendedCapabilities: string[]; // e.g. "tool:web:search"
  recommendedReasoningStrategies: ReasoningStrategyType[];
  recommendedAgentRoles: string[]; // e.g. "researcher", "critic"
  recommendedMemoryDomains: string[];
  humanApprovalRecommended: boolean;
  modelSelectionRecommendation: string[]; // e.g. ["gpt-4o", "claude-3-5-sonnet"]
}

// ---------------------------------------------------------------------------
// Learning Repository Types
// ---------------------------------------------------------------------------

export interface LearningRecord {
  id: string;
  category: "plan" | "reflection" | "critique" | "consensus" | "strategy";
  success: boolean;
  content: any; // The payload
  tags: string[];
  createdAt: string;
}
