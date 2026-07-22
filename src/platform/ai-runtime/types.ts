// ============================================================================
// AI Runtime Platform — Core Types & Contracts
// ============================================================================

export interface AIRuntimeContext {
  correlationId: string;
  traceId: string;
  userId?: string;
  role?: string;
  timestamp: number;
}

export interface AIRequest {
  prompt: string;
  model?: string;
  agentId?: string;
  workflowId?: string;
  context?: Partial<AIRuntimeContext>;
  options?: Record<string, any>;
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    costUsd: number;
  };
  latencyMs: number;
  traceId: string;
  correlationId: string;
}

// ---------------------------------------------------------------------------
// Model Platform Types
// ---------------------------------------------------------------------------

export type ModelProviderType =
  | "ollama"
  | "litellm"
  | "openai"
  | "anthropic"
  | "gemini"
  | "azure"
  | "vertex"
  | "openrouter"
  | "vllm"
  | "lm-studio"
  | "custom";

export interface AIModelInfo {
  id: string;
  name: string;
  displayName: string;
  provider: ModelProviderType;
  family: string;
  parameterCount?: string;
  vramRequiredGb?: number;
  contextLength: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  latencyAvgMs: number;
  reliabilityScore: number; // 0.0 to 1.0
  capabilities: string[]; // e.g. ["tool-use", "vision", "embeddings", "reasoning"]
  status: "online" | "offline" | "degraded";
  version: string;
}

export type RoutingStrategy =
  | "direct"
  | "fallback"
  | "latency"
  | "cost"
  | "confidence"
  | "consensus"
  | "sequential"
  | "parallel"
  | "voting"
  | "arbitration";

export interface RoutingPolicy {
  id: string;
  name: string;
  strategy: RoutingStrategy;
  primaryModel: string;
  fallbackModels: string[];
  consensusThreshold?: number; // e.g. 0.66 for 2/3 agreement
  latencyLimitMs?: number;
  costLimitUsd?: number;
  enabled: boolean;
}

// ---------------------------------------------------------------------------
// Prompt Platform Types
// ---------------------------------------------------------------------------

export interface PromptTemplate {
  id: string;
  name: string;
  version: string;
  template: string;
  description?: string;
  variables: string[];
  inheritanceParentId?: string;
  policyId?: string; // Links to Safety Policy
  signature?: string; // Cryptographic validation signature
}

export interface PromptVersion {
  version: string;
  template: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Agent Platform Types
// ---------------------------------------------------------------------------

export type AgentRole =
  | "supervisor"
  | "worker"
  | "planner"
  | "research"
  | "reviewer"
  | "critic"
  | "executor"
  | "coordinator"
  | "reflection"
  | "self-improving"
  | "human-in-the-loop";

export type AgentLifecycleState =
  | "created"
  | "initialized"
  | "ready"
  | "idle"
  | "running"
  | "suspended"
  | "thinking"
  | "planning"
  | "waiting_for_workflow"
  | "reflecting"
  | "completed"
  | "cancelled"
  | "failed";

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  allowedModels: string[];
  allowedTools: string[];
  permissions: string[]; // e.g., ["fs:read", "network:outbound"]
  isolationLevel: "none" | "sandbox" | "secure-context";
  version: string;
}

export interface AgentState {
  id: string;
  state: AgentLifecycleState;
  currentTask?: string;
  metrics: {
    invocations: number;
    tokensConsumed: number;
    runningCostUsd: number;
    errorCount: number;
  };
  lastActive: string;
}

// ---------------------------------------------------------------------------
// Memory Platform Types
// ---------------------------------------------------------------------------

export type MemoryDomain =
  | "working"
  | "conversation"
  | "execution"
  | "knowledge"
  | "reflection"
  | "long-term";

export interface MemoryEntry {
  id: string;
  domain: MemoryDomain;
  ownerId: string; // userId, agentId, or teamId
  content: string;
  confidence: number; // 0.0 to 1.0
  timestamp: number;
  importance: number; // 1 to 10
  metadata?: Record<string, any>;
  ttlMs?: number; // 0 or undefined = infinite
}

// ---------------------------------------------------------------------------
// Knowledge Platform Types
// ---------------------------------------------------------------------------

export interface KnowledgeAsset {
  id: string;
  title: string;
  content: string;
  sourceUri: string;
  lineage: string[]; // history of transformations
  freshnessScore: number; // 0.0 to 1.0 (calculated based on update time)
  provenance: string; // source details
  tags: string[];
  embeddingsId?: string;
  metadata?: Record<string, any>;
  updatedAt: string;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relationship: string;
  weight?: number;
}

// ---------------------------------------------------------------------------
// Tool Platform Types
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  permissionsRequired: string[];
  sandboxLevel: "full" | "partial" | "none";
  version: string;
  enabled: boolean;
}

export interface ToolExecutionMetrics {
  invocations: number;
  successRate: number;
  avgLatencyMs: number;
  lastExecution: string;
  errorsCount: number;
}

// ---------------------------------------------------------------------------
// Workflow Platform Types
// ---------------------------------------------------------------------------

export interface WorkflowStep {
  id: string;
  name: string;
  type: "task" | "condition" | "approval" | "agent" | "tool";
  config: Record<string, any>;
  compensationStepId?: string; // Rollback action
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  version: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
}

export interface WorkflowExecutionState {
  id: string;
  workflowId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "compensated";
  currentStepId?: string;
  variables: Record<string, any>;
  checkpointState: Record<string, any>;
  logs: string[];
  stepResults: Record<string, any>;
  startedAt: string;
  endedAt?: string;
}

// ---------------------------------------------------------------------------
// Reasoning and Planning Types
// ---------------------------------------------------------------------------

export interface ThoughtNode {
  id: string;
  thought: string;
  confidence: number;
  parentThoughtId?: string;
  alternatives?: string[];
  evaluationScore?: number;
}

export interface AgentIntent {
  objective: string;
  constraints: string[];
  successCriteria: string[];
  assumptions: string[];
  risks: string[];
  informationGaps: string[];
}

export interface SemanticPlanStep {
  task: string;
  dependencies: string[]; // references by task name or logical index
  requiredCapabilities?: string[];
  requiredActors?: string[];
  expectedOutcome?: string;
  successCriteria?: string;
  risks?: string[];
  priority?: "low" | "medium" | "high" | "critical";
  constraints?: string[];
}

export interface ExecutionPlan {
  id: string;
  objective: string;
  steps: SemanticPlanStep[];
  confidence: number;
}

// ---------------------------------------------------------------------------
// Evaluation Platform Types
// ---------------------------------------------------------------------------

export interface EvaluationResult {
  id: string;
  promptId: string;
  modelId: string;
  latencyMs: number;
  costUsd: number;
  hallucinationIndex: number; // 0.0 to 1.0 (0 = clean, 1 = hallucinated)
  groundingScore: number; // 0.0 to 1.0
  safetyViolation: boolean;
  qualityRating: number; // 1 to 5
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Human Collaboration Types
// ---------------------------------------------------------------------------

export interface HumanApprovalRequest {
  id: string;
  executionId: string;
  stepId: string;
  requestType: "approval" | "override" | "correction";
  description: string;
  requestedBy: string;
  assignedTo: string[];
  status: "pending" | "approved" | "rejected" | "timed_out";
  decisionDetails?: {
    approvedBy: string;
    overridePayload?: any;
    feedbackComments?: string;
    timestamp: string;
  };
  createdAt: string;
}

// ---------------------------------------------------------------------------
// AI Operations & Health Types
// ---------------------------------------------------------------------------

export interface OperationsMetrics {
  totalCalls: number;
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  errorRate: number;
  cacheHitRate: number;
  activeAgents: number;
  activeWorkflows: number;
  modelDistribution: Record<string, number>;
  activeCalls?: number;
}

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  uptimeSeconds: number;
  components: {
    inferenceEngine: "online" | "offline" | "degraded";
    agentRegistry: "online" | "offline";
    memoryStore: "online" | "offline";
    knowledgeGraph: "online" | "offline";
    securitySandbox: "online" | "offline";
  };
  timestamp: string;
}
