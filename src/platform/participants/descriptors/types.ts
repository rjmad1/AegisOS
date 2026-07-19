/**
 * Core types for the Platform Participant Runtime (PPR).
 * 
 * Defines the immutable descriptors that the factory uses to instantiate
 * participants in the AegisOS ecosystem.
 */

/**
 * The base identity of any participant.
 */
export interface ParticipantIdentity {
  id: string;
  name: string;
  description: string;
  type: ParticipantType;
  version: string;
}

export type ParticipantType = 
  | 'AI_AGENT'
  | 'HUMAN'
  | 'MCP_SERVER'
  | 'WORKFLOW'
  | 'BROWSER'
  | 'PYTHON_RUNTIME'
  | 'REMOTE_NODE'
  | 'EXTERNAL_SERVICE';

/**
 * Layer 1 — Universal Execution Descriptor (UED)
 * Mandatory for every participant. Contains no cognitive logic.
 */
export interface UniversalExecutionDescriptor {
  identity: ParticipantIdentity;
  
  // Execution Context
  sandbox?: SandboxConfig;
  trustLevel: TrustLevel;
  security: SecurityPolicy;
  
  // Capabilities & Limits
  capabilities: string[]; // List of capability IDs this participant can request
  resourceBudgets: ResourceBudgets;
  
  // Lifecycle & Health
  lifecycle: LifecycleConfig;
  health: HealthConfig;
  
  // Observability
  observability: ObservabilityConfig;
  policies: PolicyReference[];
  
  compatibility: CompatibilityConfig;
}

export type TrustLevel = 'UNTRUSTED' | 'SANDBOXED' | 'TRUSTED' | 'SYSTEM';

export interface SandboxConfig {
  networkAccess: boolean;
  filesystemAccess: 'NONE' | 'READ_ONLY' | 'READ_WRITE';
  allowedPaths?: string[];
  allowedHosts?: string[];
}

export interface SecurityPolicy {
  requiresApprovalForDestructiveActions: boolean;
  maxExecutionTimeMs: number;
}

export interface ResourceBudgets {
  maxComputeTokens?: number; // For AI agents
  maxMemoryMb?: number;
  maxStorageMb?: number;
  maxConcurrentTasks?: number;
  costLimitUsd?: number;
}

export interface LifecycleConfig {
  autoRestart: boolean;
  maxRetries: number;
  timeoutMs?: number;
}

export interface HealthConfig {
  checkIntervalMs?: number;
  timeoutMs?: number;
}

export interface ObservabilityConfig {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  enableTracing: boolean;
  tags: string[];
}

export interface PolicyReference {
  policyId: string;
  enforcementMode: 'WARN' | 'ENFORCE';
}

export interface CompatibilityConfig {
  minKernelVersion: string;
  requiredExtensions: string[];
}

/**
 * Layer 2 — Participant Extensions
 * 
 * Base interface for all extensions.
 */
export interface ParticipantExtension {
  type: ExtensionType;
}

export type ExtensionType = 
  | 'COGNITIVE'
  | 'HUMAN_INTERACTION'
  | 'WORKFLOW'
  | 'MCP'
  | 'PYTHON_RUNTIME'
  | 'BROWSER';

/**
 * Cognitive Descriptor (CD) - For AI Agents
 */
export interface CognitiveDescriptor extends ParticipantExtension {
  type: 'COGNITIVE';
  mission: string;
  
  // Strategies
  reasoningStrategies: string[];
  planningStrategies: string[];
  
  // Memory
  memoryDomains: string[];
  
  // Policies & Rules
  delegationRules: DelegationRule[];
  collaborationPolicies: string[];
  humanApprovalRules: string[];
  
  // Models
  preferredModels: string[];
  fallbackModels: string[];
  
  confidenceThresholds: {
    minimumActionConfidence: number;
    minimumResponseConfidence: number;
  };
}

export interface DelegationRule {
  taskType: string;
  allowedTargetTypes: ParticipantType[];
  requiresApproval: boolean;
}

/**
 * Human Interaction Descriptor (HID) - For Human Operators
 */
export interface HumanInteractionDescriptor extends ParticipantExtension {
  type: 'HUMAN_INTERACTION';
  interactionPreferences: {
    preferredNotificationChannels: string[];
    maxInterruptsPerHour: number;
  };
  approvalRules: string[];
  availability: 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';
}

/**
 * MCP Descriptor (MCPD) - For external MCP Servers
 */
export interface MCPDescriptor extends ParticipantExtension {
  type: 'MCP';
  protocolVersion: string;
  transport: 'STDIO' | 'SSE' | 'WEBSOCKET';
  supportedTools: string[];
  supportedResources: string[];
  authentication?: {
    type: 'API_KEY' | 'OAUTH' | 'NONE';
  };
}

/**
 * Workflow Descriptor (WD) - For Workflow Execution
 */
export interface WorkflowDescriptor extends ParticipantExtension {
  type: 'WORKFLOW';
  checkpointPolicy: 'NONE' | 'ON_STEP_COMPLETE' | 'ON_STATE_CHANGE';
  parallelismLimit: number;
  retryDefaults: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

/**
 * Layer 3 — Composite Descriptor
 * Represents a fully resolved participant descriptor (UED + Extensions)
 */
export interface ResolvedParticipantDescriptor {
  base: UniversalExecutionDescriptor;
  extensions: ParticipantExtension[];
}
