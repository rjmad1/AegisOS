// src/platform/control-plane/types.ts

export type ResourceCategory =
  | 'windows-service'
  | 'process'
  | 'docker-container'
  | 'wsl-service'
  | 'ollama'
  | 'litellm'
  | 'openclaw'
  | 'omniroute'
  | 'mcp-server'
  | 'database'
  | 'vector-store'
  | 'port'
  | 'scheduled-task'
  | 'network-interface'
  | 'storage-device'
  | 'gpu'
  | 'cpu'
  | 'ram'
  | 'ai-model'
  | 'extension'
  | 'plugin'
  | 'knowledge-source';

export type LifecycleState =
  | 'unknown'
  | 'discovering'
  | 'initializing'
  | 'starting'
  | 'running'
  | 'paused'
  | 'maintenance'
  | 'healing'
  | 'recovering'
  | 'stopping'
  | 'stopped'
  | 'failed'
  | 'degraded'
  | 'ready'
  | 'bootstrapping'
  | 'resolving'
  | 'error';

export type HealthStatus =
  | 'healthy'
  | 'warning'
  | 'degraded'
  | 'critical'
  | 'offline'
  | 'unknown';

export interface PlatformComponent {
  id: string;
  name: string;
  category: ResourceCategory;
  status: HealthStatus;
  lifecycleState: LifecycleState;
  dependencies: string[];
  capabilities: string[];
  healthEndpoint?: string;
  configSource?: string;
  recoveryStrategy?: string;
  ownerModule?: string;
  pid?: number;
  port?: number;
  metadata?: Record<string, any>;
  healthHandler?: () => Promise<HealthCheckResult>;
  metricsHandler?: () => Promise<Record<string, number>>;
  commands?: Record<string, () => void | Promise<any>>;
}

export interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  latencyMs: number;
  timestamp: number;
  details?: Record<string, any>;
}

export interface DependencyLink {
  from: string;
  to: string;
  label?: string;
}

export interface PlatformAlert {
  id: string;
  severity: 'low' | 'warning' | 'critical';
  entityId: string;
  message: string;
  evidence?: string;
  impact?: string;
  suggestedFix?: string;
  oneClickRepairId?: string;
  timestamp: number;
}

export interface DiagnosticsReport {
  id: string;
  timestamp: number;
  target: string;
  rootCause: string;
  impact: string;
  evidence: string;
  confidence: number; // 0.0 - 1.0
  recommendedFix: string;
  autoFixAvailable: boolean;
  fixed?: boolean;
}

export interface MetricDataPoint {
  timestamp: number;
  cpuUsage: number;
  gpuUsage: number;
  vramUsage: number; // Bytes
  ramUsage: number; // Bytes
  diskUsage: number; // Bytes
  networkRx: number; // Bytes/sec
  networkTx: number; // Bytes/sec
  inferenceLatency: number; // ms
  tokenThroughput: number; // tps
  queueDepth: number;
  requestsCount: number;
  errorsCount: number;
  retriesCount: number;
  fallbacksCount: number;
  agentUtilization: number; // percentage
  knowledgeLatency: number; // ms
  embeddingLatency: number; // ms
  workflowDuration: number; // ms
  modelLoadTime: number; // ms
  mcpLatency: number; // ms
}

export interface ScheduledTask {
  id: string;
  name: string;
  schedule: string; // cron or string description
  lastRun?: number;
  nextRun?: number;
  status: 'idle' | 'running' | 'success' | 'failed';
  enabled: boolean;
  handler: () => void | Promise<void>;
}

export interface BackupMetadata {
  id: string;
  timestamp: number;
  type: 'full' | 'incremental' | 'snapshot';
  sizeBytes: number;
  location: string;
  status: 'success' | 'failed' | 'in_progress';
  details?: string;
}

export interface SecurityPosture {
  score: number; // 0 - 100
  timestamp: number;
  checks: {
    name: string;
    passed: boolean;
    severity: 'low' | 'medium' | 'high';
    details: string;
  }[];
}

// ============================================================================
// Evolved Production platform Types
// ============================================================================

export type PlatformEventName =
  | 'ComponentRegistered'
  | 'ComponentRemoved'
  | 'HealthChanged'
  | 'AlertRaised'
  | 'AlertResolved'
  | 'MetricUpdated'
  | 'ServiceStarted'
  | 'ServiceStopped'
  | 'ModelLoaded'
  | 'ModelUnloaded'
  | 'WorkflowStarted'
  | 'WorkflowCompleted'
  | 'BackupCreated'
  | 'BackupRestored'
  | 'SecurityViolationDetected'
  | 'ConfigurationChanged'
  | 'DependencyChanged';

// Workflow structures
export interface WorkflowStep {
  id: string;
  name: string;
  dependsOn?: string[];
  action: () => Promise<void>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  retryCount?: number;
  maxRetries?: number;
  timeoutMs?: number;
  rollbackAction?: () => Promise<void>;
}

export interface WorkflowInstance {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  steps: WorkflowStep[];
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

// Job Scheduler structures
export interface SchedulerJob {
  id: string;
  name: string;
  schedule: string; // cron format or 'once' or 'event:<name>'
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'running' | 'completed' | 'failed';
  retriesRemaining: number;
  maxRetries: number;
  timeoutMs: number;
  owner: string;
  lastRun?: number;
  nextRun?: number;
  executionLogs: string[];
}

// RBAC contracts
export type UserRole =
  | 'Administrator'
  | 'Operator'
  | 'Developer'
  | 'Auditor'
  | 'Observer'
  | 'Automation'
  | 'API Client';

export type UserContext = {
  id: string;
  role: UserRole;
};

export type PlatformPermission =
  | 'platform:start'
  | 'platform:stop'
  | 'platform:restart'
  | 'platform:maintenance'
  | 'service:control'
  | 'service:logs'
  | 'config:modify'
  | 'security:audit'
  | 'backup:create'
  | 'backup:restore'
  | 'workflow:trigger'
  | 'obs:read'
  | 'node:modify';

// Cluster nodes structures
export interface WorkstationNode {
  nodeId: string;
  hostname: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'degraded';
  role: 'leader' | 'worker';
  lastSeen: number;
  cpuCores: number;
  totalRamBytes: number;
  gpuInfo?: string;
}
