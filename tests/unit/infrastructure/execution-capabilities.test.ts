// tests/unit/infrastructure/execution-capabilities.test.ts
// Integration and E2E verification for harvested Parallel Execution & Workspace Isolation capabilities

import { describe, it, expect, vi } from "vitest";
import { extensionRegistry } from "@/platform/extension/ExtensionFramework";
import { declareExecutionExtensionPoints } from "@/infrastructure/contracts/execution-extension-points";
import { IWorkspaceProvider, WorkspaceDescriptor } from "@/infrastructure/contracts/workspace";
import { IExecutionProvider, ExecutionDescriptor } from "@/infrastructure/contracts/execution";
import { IExecutorProvider } from "@/infrastructure/contracts/executor";
import { IExecutionStreamProvider, StreamEvent } from "@/infrastructure/contracts/execution-stream";
import { IMergeProvider } from "@/infrastructure/contracts/merge";

describe("Harvested Execution Capabilities - Integration & E2E Validation", () => {
  
  it("should declare all 5 harvested extension points in the registry", () => {
    // Re-declare to ensure they are registered in the current test context
    declareExecutionExtensionPoints();

    const points = extensionRegistry.getExtensionPoints();
    const pointIds = points.map((p) => p.id);

    expect(pointIds).toContain("workspace-provider");
    expect(pointIds).toContain("execution-provider");
    expect(pointIds).toContain("executor-provider");
    expect(pointIds).toContain("execution-stream-provider");
    expect(pointIds).toContain("merge-provider");
  });

  it("should support registering mock providers and running a complete E2E workspace execution flow", async () => {
    // 1. Setup Mock Providers for each capability
    const mockWorkspace: WorkspaceDescriptor = {
      id: "ws_test_01",
      label: "Test Agent Isolation Workspace",
      rootUri: "/tmp/workspaces/ws_test_01",
      isolationKind: "mock-isolation",
      baseRef: "main",
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    const mockWorkspaceProvider: IWorkspaceProvider = {
      id: "mock-workspace-provider",
      name: "Mock Workspace Provider",
      type: "workspace-provider",
      initialize: async () => {},
      shutdown: async () => {},
      checkHealth: async () => ({ status: "healthy", latencyMs: 1, lastCheckedAt: new Date().toISOString() }),
      getCapabilities: async () => ({
        providerId: "mock-workspace-provider",
        providerName: "Mock Workspace Provider",
        version: "1.0.0",
        capabilities: [{ name: "isolation", description: "Creates mock workspaces" }],
        supportedOperations: ["create", "destroy"],
        limitations: [],
        dependencies: [],
        authRequirements: "none",
      }),
      create: async (req) => mockWorkspace,
      list: async () => [mockWorkspace],
      get: async (id) => (id === mockWorkspace.id ? mockWorkspace : null),
      destroy: async () => {},
      prune: async () => 0,
    };

    const mockExecution: ExecutionDescriptor = {
      id: "exec_test_01",
      executorId: "mock-executor-provider",
      workspaceId: "ws_test_01",
      status: "pending",
      instruction: "Refactor error handler utility",
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    const mockExecutionProvider: IExecutionProvider = {
      id: "mock-execution-provider",
      name: "Mock Execution Scheduler Provider",
      type: "execution-provider",
      initialize: async () => {},
      shutdown: async () => {},
      checkHealth: async () => ({ status: "healthy", latencyMs: 1, lastCheckedAt: new Date().toISOString() }),
      getCapabilities: async () => ({
        providerId: "mock-execution-provider",
        providerName: "Mock Execution Scheduler Provider",
        version: "1.0.0",
        capabilities: [],
        supportedOperations: [],
        limitations: [],
        dependencies: [],
        authRequirements: "none",
      }),
      schedule: async (req) => ({
        ...mockExecution,
        status: "running",
        startedAt: new Date().toISOString(),
      }),
      get: async (id) => mockExecution,
      list: async () => [mockExecution],
      cancel: async () => {},
      getPolicy: () => ({
        maxConcurrency: 3,
        maxDurationMs: 60000,
        maxTokenBudget: 10000,
        autoRetry: false,
        maxRetries: 0,
      }),
      setPolicy: () => {},
    };

    const mockExecutorProvider: IExecutorProvider = {
      id: "mock-executor-provider",
      name: "Mock Agent CLI Executor",
      type: "executor-provider",
      initialize: async () => {},
      shutdown: async () => {},
      checkHealth: async () => ({ status: "healthy", latencyMs: 1, lastCheckedAt: new Date().toISOString() }),
      getCapabilities: async () => ({
        providerId: "mock-executor-provider",
        providerName: "Mock Agent CLI Executor",
        version: "1.0.0",
        capabilities: [],
        supportedOperations: [],
        limitations: [],
        dependencies: [],
        authRequirements: "none",
      }),
      getExecutorCapabilities: () => ({
        supportsStreaming: true,
        supportsCancellation: true,
        supportsWorkspaceIsolation: true,
        requiredEnvVars: [],
      }),
      run: async (req) => ({
        exitCode: 0,
        status: "completed",
        summary: "Refactored errors.ts successfully",
        durationMs: 150,
        metadata: {},
      }),
      terminate: async () => {},
      getStatus: () => "completed",
    };

    const streamEvents: StreamEvent[] = [];
    const mockStreamProvider: IExecutionStreamProvider = {
      id: "mock-stream-provider",
      name: "Mock Event Stream Provider",
      type: "execution-stream-provider",
      initialize: async () => {},
      shutdown: async () => {},
      checkHealth: async () => ({ status: "healthy", latencyMs: 1, lastCheckedAt: new Date().toISOString() }),
      getCapabilities: async () => ({
        providerId: "mock-stream-provider",
        providerName: "Mock Event Stream Provider",
        version: "1.0.0",
        capabilities: [],
        supportedOperations: [],
        limitations: [],
        dependencies: [],
        authRequirements: "none",
      }),
      subscribe: (execId, handler) => {
        const sub = {
          id: "sub_01",
          executionId: execId,
          unsubscribe: () => {},
        };
        return sub;
      },
      getHistory: async () => streamEvents,
      emit: (event) => {
        streamEvents.push(event);
      },
    };

    const mockMergeProvider: IMergeProvider = {
      id: "mock-merge-provider",
      name: "Mock Merge Reconciliation Provider",
      type: "merge-provider",
      initialize: async () => {},
      shutdown: async () => {},
      checkHealth: async () => ({ status: "healthy", latencyMs: 1, lastCheckedAt: new Date().toISOString() }),
      getCapabilities: async () => ({
        providerId: "mock-merge-provider",
        providerName: "Mock Merge Reconciliation Provider",
        version: "1.0.0",
        capabilities: [],
        supportedOperations: [],
        limitations: [],
        dependencies: [],
        authRequirements: "none",
      }),
      preview: async (req) => ({
        sourceWorkspaceId: req.sourceWorkspaceId,
        targetRef: req.targetRef,
        status: "clean",
        diffs: [{ path: "src/utils/errors.ts", changeType: "modified", additions: 10, deletions: 2 }],
        conflicts: [],
      }),
      merge: async (req) => ({
        success: true,
        resultRef: "commit_sha_abc123",
        status: "merged",
        message: "Merged clean changes from workspace",
      }),
      abort: async () => {},
    };

    // 2. Register mock extensions under the newly declared points
    extensionRegistry.registerExtension({
      pointId: "workspace-provider",
      extensionId: mockWorkspaceProvider.id,
      implementation: mockWorkspaceProvider,
    });
    extensionRegistry.registerExtension({
      pointId: "execution-provider",
      extensionId: mockExecutionProvider.id,
      implementation: mockExecutionProvider,
    });
    extensionRegistry.registerExtension({
      pointId: "executor-provider",
      extensionId: mockExecutorProvider.id,
      implementation: mockExecutorProvider,
    });
    extensionRegistry.registerExtension({
      pointId: "execution-stream-provider",
      extensionId: mockStreamProvider.id,
      implementation: mockStreamProvider,
    });
    extensionRegistry.registerExtension({
      pointId: "merge-provider",
      extensionId: mockMergeProvider.id,
      implementation: mockMergeProvider,
    });

    // 3. E2E Execution flow
    // Step A: Fetch providers from the registry
    const workspaceProv = extensionRegistry.getExtensions<IWorkspaceProvider>("workspace-provider")[0];
    const execProv = extensionRegistry.getExtensions<IExecutionProvider>("execution-provider")[0];
    const executorProv = extensionRegistry.getExtensions<IExecutorProvider>("executor-provider")[0];
    const streamProv = extensionRegistry.getExtensions<IExecutionStreamProvider>("execution-stream-provider")[0];
    const mergeProv = extensionRegistry.getExtensions<IMergeProvider>("merge-provider")[0];

    expect(workspaceProv).toBeDefined();
    expect(execProv).toBeDefined();
    expect(executorProv).toBeDefined();
    expect(streamProv).toBeDefined();
    expect(mergeProv).toBeDefined();

    // Step B: Create isolated workspace
    const workspace = await workspaceProv.create({
      label: "Parallel execution test",
      baseRef: "main",
    });
    expect(workspace.id).toBe("ws_test_01");
    expect(workspace.rootUri).toContain("ws_test_01");

    // Step C: Schedule execution
    const execution = await execProv.schedule({
      executorId: executorProv.id,
      workspaceId: workspace.id,
      instruction: "Refactor errors",
    });
    expect(execution.status).toBe("running");

    // Step D: Simulate executor streaming logs
    const logEvent: StreamEvent = {
      executionId: execution.id,
      type: "stdout",
      data: "Refactoring errors.ts...",
      timestamp: new Date().toISOString(),
      sequence: 1,
    };
    streamProv.emit(logEvent);

    const history = await streamProv.getHistory(execution.id);
    expect(history.length).toBe(1);
    expect(history[0].data).toBe("Refactoring errors.ts...");

    // Step E: Run the execution inside the executor
    const runResult = await executorProv.run({
      instruction: execution.instruction,
      workingDirectory: workspace.rootUri,
    });
    expect(runResult.exitCode).toBe(0);
    expect(runResult.status).toBe("completed");

    // Step F: Merge changes back to main branch
    const mergePreview = await mergeProv.preview({
      sourceWorkspaceId: workspace.id,
      targetRef: "main",
    });
    expect(mergePreview.status).toBe("clean");
    expect(mergePreview.diffs[0].path).toBe("src/utils/errors.ts");

    const mergeResult = await mergeProv.merge({
      sourceWorkspaceId: workspace.id,
      targetRef: "main",
      cleanupSource: true,
    });
    expect(mergeResult.success).toBe(true);
    expect(mergeResult.status).toBe("merged");

    // Step G: Cleanup workspace
    await workspaceProv.destroy(workspace.id);
  });
});
