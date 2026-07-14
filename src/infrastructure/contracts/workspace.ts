// ============================================================================
// Workspace Provider Contract — Isolated Execution Environment Abstraction
// ============================================================================
// Harvested pattern: filesystem-level isolation for parallel agent execution.
// Technology-agnostic: Git worktrees, Docker volumes, temp directories, chroot,
// VM snapshots, or any mechanism that provides an isolated mutable workspace
// are all valid implementations behind this single contract.
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

/** Opaque handle representing an isolated workspace instance. */
export interface WorkspaceDescriptor {
  /** Unique workspace identifier. */
  id: string;
  /** Human-readable label for display and logging. */
  label: string;
  /** Absolute path or URI to the workspace root. */
  rootUri: string;
  /** The isolation mechanism that created this workspace. */
  isolationKind: string;
  /** The base reference from which this workspace was derived (e.g., branch name, snapshot ID). */
  baseRef: string;
  /** ISO-8601 timestamp of workspace creation. */
  createdAt: string;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
}

export interface CreateWorkspaceRequest {
  /** Human-readable label. */
  label: string;
  /** Base reference to derive from (e.g., branch, commit, snapshot). */
  baseRef: string;
  /** Optional target path hint — provider may override. */
  targetPath?: string;
  /** Provider-specific options. */
  options?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

export interface IWorkspaceProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "workspace-provider";

  /** Create a new isolated workspace derived from a base reference. */
  create(request: CreateWorkspaceRequest): Promise<WorkspaceDescriptor>;

  /** List all active workspaces managed by this provider. */
  list(): Promise<WorkspaceDescriptor[]>;

  /** Get a workspace by ID. Returns null if not found. */
  get(workspaceId: string): Promise<WorkspaceDescriptor | null>;

  /** Destroy an isolated workspace, reclaiming resources. */
  destroy(workspaceId: string): Promise<void>;

  /** Prune all orphaned/abandoned workspaces that are no longer tracked. */
  prune(): Promise<number>;
}
