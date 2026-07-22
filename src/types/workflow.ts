export type NodeType =
  | "trigger"
  | "condition"
  | "decision"
  | "parallel"
  | "loop"
  | "delay"
  | "approval"
  | "notification"
  | "provider_call"
  | "script"
  | "sub_workflow"
  | "swarm"
  | "debate"
  | "end";

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  config: Record<string, any>;
  next?: string;        // ID of next node to run
  nextTrue?: string;    // for condition / decision nodes
  nextFalse?: string;   // for condition / decision nodes
  branches?: string[];  // for parallel nodes, start nodes of each parallel path
  mergeNodeId?: string; // for parallel nodes, where branches sync back
}

export interface WorkflowRelationship {
  targetId: string;
  type: "artifact" | "provider" | "infrastructure" | "conversation" | "execution" | "model" | "knowledge" | "user" | "approval";
  description: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string; // e.g. "1.0.0"
  status: "active" | "draft" | "deprecated";
  nodes: WorkflowNode[];
  capabilities: string[];
  dependencies: string[];
  relationships: WorkflowRelationship[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  nodes: WorkflowNode[];
  metadata: Record<string, any>;
}

export interface ExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  name: string;
  type: NodeType;
  status: "queued" | "running" | "completed" | "failed" | "cancelled" | "waiting";
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  input?: any;
  output?: any;
  error?: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  workflowName: string;
  conversationId?: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled" | "waiting_approval" | "delayed";
  currentNodeId?: string;
  variables: Record<string, any>;
  checkpointState: {
    completedNodeIds: string[];
    activeParallelBranches?: string[]; // active branch start node IDs
    branchStates?: Record<string, any>; // local vars for parallel branches
    loopCounters?: Record<string, number>; // loop node ID -> current iteration
  };
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
  error?: string;
  steps: ExecutionStep[];
  logs: ExecutionLog[];
  artifacts: { id: string; name: string; type: string }[];
  approvals: string[]; // approval request IDs
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export interface WorkflowSchedule {
  id: string;
  workflowId: string;
  name: string;
  type: "cron" | "one-time" | "recurring" | "event-based" | "manual" | "delayed";
  cronExpression?: string; // for cron
  intervalSeconds?: number; // for recurring
  runAt?: string; // for one-time or delayed
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  retryConfig?: {
    maxRetries: number;
    backoffDelaySeconds: number;
  };
}

export interface WorkflowApproval {
  id: string;
  executionId: string;
  nodeId: string;
  workflowId: string;
  workflowName: string;
  type: "single" | "multiple" | "quorum";
  approvers: string[]; // list of userIds or emails
  quorumPercentage?: number; // e.g. 50 (must be 50% or more approval)
  timeoutSeconds?: number;
  escalationUser?: string; // userId to escalate on timeout
  status: "pending" | "approved" | "rejected" | "timed_out" | "delegated";
  decisions: Record<string, "approved" | "rejected">; // approverId -> action
  delegatedTo?: string; // approverId delegated to
  createdAt: string;
  actionedAt?: string;
}

export interface WorkflowHistory {
  id: string;
  workflowId: string;
  changeType: "create" | "update_definition" | "new_version" | "deprecate";
  version: string;
  userId: string;
  userEmail: string;
  details: string;
  timestamp: string;
}
