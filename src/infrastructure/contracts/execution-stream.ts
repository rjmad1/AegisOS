// ============================================================================
// Execution Stream Provider Contract — Real-time Output Streaming Abstraction
// ============================================================================
// Harvested pattern: live relay of agent stdout/stderr to UI consumers.
// Technology-agnostic: WebSocket, Server-Sent Events, long-polling, file tail,
// or in-memory pub/sub are all valid transport implementations behind this
// single subscription contract.
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export type StreamEventType = "stdout" | "stderr" | "status" | "error" | "metric";

export interface StreamEvent {
  /** The execution this event belongs to. */
  executionId: string;
  /** Kind of event. */
  type: StreamEventType;
  /** Text payload. */
  data: string;
  /** ISO-8601 timestamp. */
  timestamp: string;
  /** Sequence number for ordering. */
  sequence: number;
}

export type StreamSubscriptionHandler = (event: StreamEvent) => void;

export interface StreamSubscription {
  /** Unique subscription identifier. */
  id: string;
  /** The execution being observed. */
  executionId: string;
  /** Unsubscribe from the stream. */
  unsubscribe(): void;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

export interface IExecutionStreamProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "execution-stream-provider";

  /** Subscribe to real-time output from a running execution. */
  subscribe(executionId: string, handler: StreamSubscriptionHandler): StreamSubscription;

  /** Retrieve buffered events for an execution (replay / catch-up). */
  getHistory(executionId: string, options?: { since?: string; limit?: number }): Promise<StreamEvent[]>;

  /** Emit an event into the stream (used by executor providers). */
  emit(event: StreamEvent): void;
}
