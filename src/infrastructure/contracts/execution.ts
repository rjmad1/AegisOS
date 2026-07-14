// ============================================================================
// Execution Provider Contract — Parallel Execution Scheduling Abstraction
// ============================================================================
// Harvested pattern: parallel agent task scheduling with concurrency control,
// policy enforcement, and lifecycle tracking.
// Technology-agnostic: local process pool, container orchestrator, serverless
// dispatcher, or remote job scheduler are all valid implementations.
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export type ExecutionStatus =
  | "pending"
  | "queued"
  | "running"
  | "review"
  | "completed"
  | "failed"
  | "cancelled"
  | "timed_out";

export interface ExecutionDescriptor {
  /** Unique execution identifier. */
  id: string;
  /** Reference to the executor provider that will run this execution. */
  executorId: string;
  /** Reference to the workspace this execution operates within. */
  workspaceId: string;
  /** Current lifecycle status. */
  status: ExecutionStatus;
  /** The instruction or prompt dispatched to the agent. */
  instruction: string;
  /** ISO-8601 timestamps. */
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  /** Exit code or result summary from the executor. */
  exitCode?: number;
  /** Arbitrary provider-specific metadata (token usage, cost, etc.). */
  metadata: Record<string, unknown>;
}

export interface ScheduleExecutionRequest {
  /** The executor provider to use. */
  executorId: string;
  /** The workspace to execute within. */
  workspaceId: string;
  /** Instruction or prompt for the agent. */
  instruction: string;
  /** Priority (lower number = higher priority). */
  priority?: number;
  /** Maximum execution duration in milliseconds. 0 = no limit. */
  timeoutMs?: number;
  /** Provider-specific options. */
  options?: Record<string, unknown>;
}

export interface ExecutionPolicy {
  /** Maximum concurrent executions allowed. */
  maxConcurrency: number;
  /** Maximum execution duration in milliseconds. */
  maxDurationMs: number;
  /** Maximum token budget per execution (0 = unlimited). */
  maxTokenBudget: number;
  /** Whether to auto-retry on transient failures. */
  autoRetry: boolean;
  /** Maximum retry attempts. */
  maxRetries: number;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

export interface IExecutionProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "execution-provider";

  /** Schedule a new execution. Respects active policy constraints. */
  schedule(request: ScheduleExecutionRequest): Promise<ExecutionDescriptor>;

  /** Get execution by ID. */
  get(executionId: string): Promise<ExecutionDescriptor | null>;

  /** List executions, optionally filtered by status. */
  list(filter?: { status?: ExecutionStatus; workspaceId?: string }): Promise<ExecutionDescriptor[]>;

  /** Cancel a running or queued execution. */
  cancel(executionId: string): Promise<void>;

  /** Get the active execution policy. */
  getPolicy(): ExecutionPolicy;

  /** Update the active execution policy. */
  setPolicy(policy: Partial<ExecutionPolicy>): void;
}
