// ============================================================================
// Merge Provider Contract — Artifact Reconciliation Abstraction
// ============================================================================
// Harvested pattern: diff, preview, reconcile, and finalize artifacts from
// isolated workspaces back into the primary workspace.
// Technology-agnostic: Git merge/rebase, file-level patch, API-based merge,
// or manual conflict resolution UI are all valid implementations.
// ============================================================================

import { IInfrastructureProvider } from "./provider";
import { IHealthCheckable } from "../health/types";
import { IDiscoveryEnabled } from "../discovery/types";

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export type MergeStatus = "pending" | "clean" | "conflict" | "merged" | "rejected";

export interface DiffEntry {
  /** Relative path of the changed file. */
  path: string;
  /** Kind of change. */
  changeType: "added" | "modified" | "deleted" | "renamed";
  /** Number of lines added. */
  additions: number;
  /** Number of lines removed. */
  deletions: number;
}

export interface MergePreview {
  /** The workspace being merged from. */
  sourceWorkspaceId: string;
  /** The target workspace or ref being merged into. */
  targetRef: string;
  /** Overall merge feasibility. */
  status: MergeStatus;
  /** List of changed files. */
  diffs: DiffEntry[];
  /** Conflicting file paths (empty if status is 'clean'). */
  conflicts: string[];
}

export interface MergeResult {
  /** Whether the merge completed successfully. */
  success: boolean;
  /** The resulting reference after merge (e.g., commit hash, version ID). */
  resultRef?: string;
  /** Merge status. */
  status: MergeStatus;
  /** Summary message. */
  message: string;
}

export interface MergeRequest {
  /** The source workspace whose changes are being merged. */
  sourceWorkspaceId: string;
  /** The target reference to merge into. */
  targetRef: string;
  /** Merge strategy hint. */
  strategy?: "merge" | "rebase" | "squash" | "patch";
  /** Whether to auto-delete the source workspace after a successful merge. */
  cleanupSource?: boolean;
  /** Provider-specific options. */
  options?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Provider Contract
// ---------------------------------------------------------------------------

export interface IMergeProvider
  extends IInfrastructureProvider,
    IHealthCheckable,
    IDiscoveryEnabled {
  type: "merge-provider";

  /** Preview what a merge would look like without performing it. */
  preview(request: MergeRequest): Promise<MergePreview>;

  /** Execute the merge. */
  merge(request: MergeRequest): Promise<MergeResult>;

  /** Abort or roll back a failed/in-progress merge. */
  abort(sourceWorkspaceId: string): Promise<void>;
}
