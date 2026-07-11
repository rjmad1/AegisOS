// ============================================================================
// Canonical AI Runtime Models — Phase 6
// ============================================================================
// These types form the canonical data contract between infrastructure adapters,
// the aggregation service, API routes, and UI components.
// Native Ollama/LiteLLM models must NEVER leak past this boundary.
// ============================================================================

// ---------------------------------------------------------------------------
// Core Enums & Literals
// ---------------------------------------------------------------------------

export type AIProviderType = "gateway" | "inference" | "embedding" | "hybrid";
export type ModelStatus = "running" | "loaded" | "available" | "stopped" | "unknown";
export type EndpointProtocol = "http" | "https" | "grpc";
export type AuthRequirement = "none" | "api-key" | "token" | "oauth" | "custom";
export type QuantizationFormat =
  | "Q2_K" | "Q3_K_S" | "Q3_K_M" | "Q3_K_L"
  | "Q4_0" | "Q4_1" | "Q4_K_S" | "Q4_K_M"
  | "Q5_0" | "Q5_1" | "Q5_K_S" | "Q5_K_M"
  | "Q6_K" | "Q8_0"
  | "fp16" | "fp32" | "bf16"
  | "unknown";
export type CapabilityName =
  | "tool-calling" | "vision" | "reasoning" | "embeddings"
  | "streaming" | "json-mode" | "function-calling" | "parallel-tool-calls"
  | "image-input" | "audio-input" | "video-input"
  | "temperature" | "top-p" | "seed" | "structured-output"
  | "code-generation" | "chat" | "completion";
export type LoadBalancingStrategy = "round-robin" | "least-connections" | "random" | "weighted" | "none";
export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown" | "unreachable";

// ---------------------------------------------------------------------------
// AIProvider
// ---------------------------------------------------------------------------

export interface AIProvider {
  id: string;
  name: string;
  type: AIProviderType;
  description: string;
  version: string;
  endpoints: Endpoint[];
  health: ProviderHealth;
  capabilities: ProviderCapabilities;
  modelCount: number;
  aliasCount: number;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// AIModel
// ---------------------------------------------------------------------------

export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  family: string;
  providerId: string;
  providerName: string;
  status: ModelStatus;
  parameters: string;
  parameterCount: number | null;
  sizeBytes: number;
  sizeDisplay: string;
  quantization: Quantization;
  contextWindow: ContextWindow;
  capabilities: Capability[];
  aliases: string[];
  deployment: Deployment;
  lifecycle: ModelLifecycle;
  license: string;
  architecture: string;
  templateFormat: string;
  digest: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ModelAlias
// ---------------------------------------------------------------------------

export interface ModelAlias {
  alias: string;
  modelId: string;
  modelName: string;
  providerId: string;
  providerName: string;
  description: string;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Endpoint
// ---------------------------------------------------------------------------

export interface Endpoint {
  id: string;
  url: string;
  protocol: EndpointProtocol;
  providerId: string;
  providerName: string;
  auth: AuthRequirement;
  status: HealthStatus;
  latencyMs: number;
  lastCheckedAt: string;
}

// ---------------------------------------------------------------------------
// Deployment
// ---------------------------------------------------------------------------

export interface Deployment {
  status: ModelStatus;
  loadedAt: string | null;
  gpuLayers: number | null;
  gpuMemoryUsed: string | null;
  cpuThreads: number | null;
  expiresAt: string | null;
}

// ---------------------------------------------------------------------------
// Capability
// ---------------------------------------------------------------------------

export interface Capability {
  name: CapabilityName;
  supported: boolean;
  description: string;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// ContextWindow
// ---------------------------------------------------------------------------

export interface ContextWindow {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ---------------------------------------------------------------------------
// Quantization
// ---------------------------------------------------------------------------

export interface Quantization {
  format: QuantizationFormat;
  bitsPerWeight: number | null;
  description: string;
}

// ---------------------------------------------------------------------------
// TokenizerInfo
// ---------------------------------------------------------------------------

export interface TokenizerInfo {
  type: string;
  vocabSize: number | null;
}

// ---------------------------------------------------------------------------
// Specialized Model Markers
// ---------------------------------------------------------------------------

export interface EmbeddingModel {
  dimensions: number;
  maxInputTokens: number;
  similarity: "cosine" | "dot-product" | "euclidean";
}

export interface VisionModel {
  supportedFormats: string[];
  maxImageSize: string;
  multiImage: boolean;
}

export interface ReasoningModel {
  chainOfThought: boolean;
  thinkingTokens: boolean;
}

export interface ToolCallingModel {
  parallelCalls: boolean;
  maxTools: number | null;
  structuredOutput: boolean;
}

// ---------------------------------------------------------------------------
// RuntimeHealth
// ---------------------------------------------------------------------------

export interface RuntimeHealth {
  overallStatus: HealthStatus;
  providers: ProviderHealth[];
  models: ModelHealth[];
  lastCheckedAt: string;
  uptimeSeconds: number;
}

// ---------------------------------------------------------------------------
// RoutingPolicy
// ---------------------------------------------------------------------------

export interface RoutingPolicy {
  id: string;
  name: string;
  virtualModelName: string;
  underlyingModels: { modelId: string; modelName: string; provider: string; weight?: number }[];
  loadBalancing: LoadBalancingStrategy;
  fallbackOrder: string[];
  retryPolicy: { maxRetries: number; retryDelayMs: number };
  timeout: number;
  cachingEnabled: boolean;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// InferenceStatistics (read-only)
// ---------------------------------------------------------------------------

export interface InferenceStatistics {
  providerId: string;
  providerName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
  lastRequestAt: string | null;
}

// ---------------------------------------------------------------------------
// ModelLifecycle
// ---------------------------------------------------------------------------

export interface ModelLifecycle {
  createdAt: string;
  modifiedAt: string;
  lastAccessedAt: string | null;
  state: ModelStatus;
}

// ---------------------------------------------------------------------------
// ProviderHealth
// ---------------------------------------------------------------------------

export interface ProviderHealth {
  providerId: string;
  providerName: string;
  status: HealthStatus;
  latencyMs: number;
  lastCheckedAt: string;
  version: string;
  errorMessage: string | null;
  heartbeat: boolean;
  checks: { name: string; status: "pass" | "fail" | "warn"; message: string }[];
}

// ---------------------------------------------------------------------------
// ModelHealth
// ---------------------------------------------------------------------------

export interface ModelHealth {
  modelId: string;
  modelName: string;
  providerId: string;
  status: HealthStatus;
  loaded: boolean;
  lastAccessedAt: string | null;
}

// ---------------------------------------------------------------------------
// ProviderCapabilities
// ---------------------------------------------------------------------------

export interface ProviderCapabilities {
  providerId: string;
  providerName: string;
  supportedCapabilities: CapabilityName[];
  supportedOperations: string[];
  limitations: string[];
  dependencies: string[];
  authRequirement: AuthRequirement;
}

// ---------------------------------------------------------------------------
// AIRuntimeSummary — top-level aggregation
// ---------------------------------------------------------------------------

export interface AIRuntimeSummary {
  providers: AIProvider[];
  totalModels: number;
  totalAliases: number;
  totalEndpoints: number;
  totalRoutes: number;
  health: RuntimeHealth;
  discoveredAt: string;
}

// ---------------------------------------------------------------------------
// Relationship Graph Node/Edge for UI rendering
// ---------------------------------------------------------------------------

export type GraphNodeType = "provider" | "gateway" | "alias" | "model" | "capability" | "runtime" | "dependency";

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  status: HealthStatus;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  type: "routes-to" | "aliases" | "provides" | "has-capability" | "depends-on" | "runs-on";
}

export interface RelationshipGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// API Pagination / Filtering DTOs
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AIModelFilters {
  provider?: string;
  capability?: CapabilityName;
  family?: string;
  status?: ModelStatus;
  search?: string;
  sortBy?: "name" | "size" | "parameters" | "provider" | "status";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}
