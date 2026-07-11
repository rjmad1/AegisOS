export interface Version {
  version: string;
  buildNumber?: string;
  apiChannel?: string;
  lastUpdated?: string;
}

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy" | "unknown";
  latencyMs: number;
  lastCheckedAt: string;
  errorMessage?: string;
  details?: Record<string, any>;
  checks?: { name: string; status: "pass" | "fail" | "warn"; message?: string }[];
}

export interface Capability {
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface Configuration {
  configPath: string;
  stateDir: string;
  activeChannels: string[];
  mcpServers: { name: string; enabled: boolean; command?: string }[];
  raw: Record<string, any>;
}

export interface RuntimeStatus {
  online: boolean;
  pid?: number;
  port?: number;
  uptimeSeconds?: number;
  memoryUsageBytes?: number;
  cpuUsagePercentage?: number;
}

export interface Runtime {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded" | "unknown";
  version: string;
  capabilities: Capability[];
  health: HealthCheckResult;
  configuration: Configuration;
  statusDetails?: RuntimeStatus;
}

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    role: "user" | "assistant" | "system" | "tool";
  };
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  tokens?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  startedAt: string;
  updatedAt: string;
  status: "active" | "completed" | "archived";
  messageCount: number;
  summary?: string;
  metadata: Record<string, any>;
  agentId?: string;
  messages?: Message[];
}

export interface ExecutionStep {
  id: string;
  executionId: string;
  name: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  timestamp: string;
  durationMs?: number;
  message?: string;
}

export interface Execution {
  id: string;
  conversationId?: string;
  workflowId?: string;
  agentId: string;
  task: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  error?: string;
  steps?: ExecutionStep[];
  artifacts?: { id: string; name: string; type: string }[];
  toolsUsed?: string[];
  retryCount: number;
  metadata: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  status: "active" | "draft" | "deprecated";
  capabilities: string[];
  dependencies: string[];
  relationships: { targetId: string; type: string; description?: string }[];
  executionHistory: { id: string; status: string; date: string; durationMs: number }[];
  metadata: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "inactive" | "degraded";
  model: string;
  capabilities: string[];
  tools: string[];
  memoryProvider?: string;
  knowledgeProvider?: string;
  healthStatus: "healthy" | "degraded" | "unhealthy";
  stats: {
    totalRuns: number;
    successRate: number;
    avgDurationMs: number;
  };
}

export interface Tool {
  name: string;
  category: string;
  provider: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  stats: {
    executionCount: number;
    successRate: number;
    failureRate: number;
    avgDurationMs: number;
  };
  status: "active" | "inactive";
}

// Session represents active MCP or TUI connection sessions
export interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  mode: string;
  sourceScope: string;
  sourceProcess?: string;
  proxyUrl?: string;
}

// Re-export this for unified models
export type { Artifact } from "./artifact";
