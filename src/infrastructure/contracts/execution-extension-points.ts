// ============================================================================
// Execution Capability Extension Points
// ============================================================================
// Declares extension points into the ExtensionRegistry so that workspace,
// execution, executor, streaming, and merge providers can be discovered,
// composed, and replaced at runtime without modifying consuming code.
//
// This module is imported during platform boot to register the extension
// points before any provider implementations register themselves.
// ============================================================================

import { ExtensionRegistry } from "@/platform/extension/ExtensionFramework";

const registry = ExtensionRegistry.getInstance();

/** Declare all execution capability extension points. */
export function declareExecutionExtensionPoints(): void {
  registry.declareExtensionPoint({
    id: "workspace-provider",
    name: "Workspace Isolation Provider",
    description:
      "Provides isolated execution environments for parallel agent work. " +
      "Implementations may use Git worktrees, Docker volumes, temp directories, VM snapshots, or any other isolation mechanism.",
  });

  registry.declareExtensionPoint({
    id: "execution-provider",
    name: "Execution Scheduling Provider",
    description:
      "Schedules, monitors, and manages parallel execution jobs within isolated workspaces. " +
      "Enforces concurrency limits, timeout policies, and token budgets.",
  });

  registry.declareExtensionPoint({
    id: "executor-provider",
    name: "Agent Executor Provider",
    description:
      "Abstracts over any agent runtime (CLI process, MCP tool call, API invocation). " +
      "Responsible for launching the agent, streaming output, and reporting exit status.",
  });

  registry.declareExtensionPoint({
    id: "execution-stream-provider",
    name: "Execution Stream Provider",
    description:
      "Provides real-time streaming of execution output to subscribers. " +
      "Decouples the transport mechanism (WebSocket, SSE, polling) from the consumption pattern.",
  });

  registry.declareExtensionPoint({
    id: "merge-provider",
    name: "Merge Reconciliation Provider",
    description:
      "Diffs, previews, reconciles, and finalizes artifacts from isolated workspaces " +
      "back into the primary workspace. Handles conflict detection and resolution signaling.",
  });
}
