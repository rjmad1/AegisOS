// ============================================================================
// Executor Provider Contract — Agent Runtime Abstraction
// ============================================================================
// Harvested pattern: the Executor trait — a unified interface for launching,
// monitoring, and terminating any agent runtime regardless of its transport
// (CLI process, MCP tool call, HTTP API, in-process function).
// Technology-agnostic: Claude Code CLI, Gemini CLI, Aider, Codex, Cursor,
// custom MCP servers, or direct API calls are all valid implementations.
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export type ExecutorStatus = "idle" | "running" | "completed" | "failed" | "terminated";

export interface ExecutorCapabilities {
  /** Whether this executor supports streaming output. */
  supportsStreaming: boolean;
  /** Whether this executor supports cancellation mid-flight. */
  supportsCancellation: boolean;
  /** Whether this executor can operate in an isolated workspace. */
  supportsWorkspaceIsolation: boolean;
  /** The set of environment variables this executor requires. */
  requiredEnvVars: string[];
}

export interface ExecutorRunRequest {
  /** The instruction or prompt to dispatch to the agent. */
  instruction: string;
  /** Absolute path or URI to the working directory. */
  workingDirectory: string;
  /** Environment variables to inject into the agent process. */
  environment?: Record<string, string>;
  /** Provider-specific options. */
  options?: Record<string, unknown>;
}

export interface ExecutorRunResult {
  /** Exit code (0 = success). */
  exitCode: number;
  /** Current status of this executor invocation. */
  status: ExecutorStatus;
  /** Summary output or final message from the agent. */
  summary?: string;
  /** Duration in milliseconds. */
  durationMs: number;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

export interface IExecutorProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "executor-provider";

  /** Describe what this executor can do. */
  getExecutorCapabilities(): ExecutorCapabilities;

  /** Launch the agent with the given instruction inside the given directory. */
  run(request: ExecutorRunRequest): Promise<ExecutorRunResult>;

  /** Terminate a running agent invocation. */
  terminate(): Promise<void>;

  /** Current status of the executor instance. */
  getStatus(): ExecutorStatus;
}
