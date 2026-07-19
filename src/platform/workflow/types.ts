// ============================================================================
// Platform Workflow Engine — Core Contracts
// ============================================================================

import type { IExecutionContext } from '../kernel/types';

// ---------------------------------------------------------------------------
// Execution Graph (Immutable JSON representation)
// ---------------------------------------------------------------------------

export interface ExecutionGraph {
  id: string;
  version: string;
  schemaVersion: string;
  name: string;
  description?: string;
  nodes: Record<string, ExecutionNode>;
  entryNodes: string[];
  metadata: Record<string, unknown>;
}

export interface ExecutionNode {
  id: string;
  type: string; // e.g., 'task', 'capability', 'parallel', 'decision'
  executorId: string; // Maps to ENR (Execution Node Registry)
  configuration: Record<string, unknown>;
  inputs: Record<string, unknown>;
  outputs: string[];
  dependencies: NodeDependency[];
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  checkpointPolicy?: CheckpointPolicy;
  metadata?: Record<string, unknown>;
}

export interface NodeDependency {
  nodeId: string;
  type: 'success' | 'failure' | 'completion' | 'conditional';
  conditionExpression?: string; // For conditional branching
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffInitialMs: number;
  backoffMaxMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // Array of error codes or message patterns
}

export interface CheckpointPolicy {
  enabled: boolean;
  saveOutputs: boolean;
}

// ---------------------------------------------------------------------------
// Persistence Model (Snapshots & Journal)
// ---------------------------------------------------------------------------

export type NodeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'suspended';
export type WorkflowStatus = 'created' | 'running' | 'suspended' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowSnapshot {
  workflowId: string;
  executionId: string;
  graphId: string; // Refers to the ExecutionGraph ID
  status: WorkflowStatus;
  context: IExecutionContext;
  nodeStates: Record<string, NodeState>;
  variables: Record<string, unknown>;
  schemaVersion: string;
  timestamp: number;
}

export interface NodeState {
  status: NodeStatus;
  attempts: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  outputs?: Record<string, unknown>;
}

export type JournalEventType =
  | 'WorkflowStarted'
  | 'WorkflowSuspended'
  | 'WorkflowResumed'
  | 'WorkflowCompleted'
  | 'WorkflowCancelled'
  | 'WorkflowFailed'
  | 'NodeStarted'
  | 'NodeCompleted'
  | 'NodeFailed'
  | 'RetryScheduled'
  | 'CheckpointCreated'
  | 'HumanApprovalRequested'
  | 'HumanApprovalGranted'
  | 'CapabilityLoaded'
  | 'CapabilityReleased'
  | 'ResourceDenied'
  | 'PolicyDenied';

export interface ExecutionJournalEvent {
  id: string;
  executionId: string;
  eventType: JournalEventType;
  timestamp: number;
  nodeId?: string;
  payload?: Record<string, unknown>;
}
