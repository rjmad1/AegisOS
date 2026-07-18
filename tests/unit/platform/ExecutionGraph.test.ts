import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import prisma from "@/infrastructure/db/prisma";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import { executionGraphService } from "@/services/execution-graph.service";
import { workflowService } from "@/services/workflow.service";
import { workflowRepository } from "@/repositories/workflow.repository";
import { ExecutionGraph, ExecutionGraphNode } from "@/types/execution-graph";

describe("Execution Graph Engine Unit & Integration Tests", () => {
  const testUser = { id: "test-user-id", email: "operator@aegis-os.local", role: "admin" };

  beforeEach(async () => {
    // Clean DB
    await prisma.message.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.workflowExecution.deleteMany({});
    await prisma.workflowApproval.deleteMany({});

    // Create a dummy completed workflow execution to prevent repository auto-seeding
    await prisma.workflowExecution.create({
      data: {
        id: "dummy-completed-exec-id",
        workflowId: "dummy-wf",
        workflowVersion: "1.0",
        workflowName: "Dummy Workflow",
        status: "succeeded",
        currentNodeId: null,
        variables: "{}",
        checkpointState: "{}",
        createdAt: new Date().toISOString(),
        steps: "[]",
        logs: "[]",
        artifacts: "[]",
        approvals: "[]",
        retryCount: 0,
        maxRetries: 3,
        metadata: "{}",
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should build a graph automatically upon execution creation", async () => {
    const rawPrompt = "Explain memory usage";
    const execution = await executionRuntimeService.createExecution(
      rawPrompt,
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata?.executionGraph as ExecutionGraph;
    expect(graph).toBeDefined();
    expect(graph.executionId).toBe(execution.executionId);
    expect(graph.nodes.length).toBe(3); // Intent -> Capability -> Agent
    expect(graph.edges.length).toBe(2);
    expect(graph.status).toBe("pending");

    expect(graph.nodes[0].type).toBe("Intent");
    expect(graph.nodes[1].type).toBe("Capability");
    expect(graph.nodes[2].type).toBe("Agent");
  });

  it("should execute sequential nodes in order and complete the graph", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Explain why memory usage is high",
      { userId: testUser.id, role: testUser.role }
    );

    const runExec = await executionRuntimeService.execute(execution.executionId);
    expect(runExec.status).toBe("COMPLETED");

    const graph = runExec.metadata.executionGraph as ExecutionGraph;
    expect(graph.status).toBe("completed");
    expect(graph.nodes.every((n) => n.status === "completed")).toBe(true);
    expect(graph.variables.assistantReply).toContain("Memory usage is currently at 84%");
  });

  it("should support parallel node execution in graph scheduling", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Run parallel tasks",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const execId = execution.executionId;

    // Construct parallel branches: Intent -> Capability -> B & C -> D
    graph.nodes = [
      { id: `${execId}-intent`, name: "Intent", type: "Intent", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-cap`, name: "Capability", type: "Capability", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-toolB`, name: "Tool B", type: "Tool", status: "queued", config: { commandType: "mock:b" }, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-toolC`, name: "Tool C", type: "Tool", status: "queued", config: { commandType: "mock:c" }, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-nodeD`, name: "Node D", type: "Agent", status: "queued", config: {}, retryCount: 0, maxRetries: 3 }
    ];

    graph.edges = [
      { id: "e1", source: `${execId}-intent`, target: `${execId}-cap`, type: "sequential", status: "pending" },
      { id: "e2", source: `${execId}-cap`, target: `${execId}-toolB`, type: "parallel", status: "pending" },
      { id: "e3", source: `${execId}-cap`, target: `${execId}-toolC`, type: "parallel", status: "pending" },
      { id: "e4", source: `${execId}-toolB`, target: `${execId}-nodeD`, type: "sequential", status: "pending" },
      { id: "e5", source: `${execId}-toolC`, target: `${execId}-nodeD`, type: "sequential", status: "pending" }
    ];

    await (executionRuntimeService as any).repository.save(execution);

    // Execute the parallel graph
    const runExec = await executionRuntimeService.execute(execId);
    expect(runExec.status).toBe("COMPLETED");

    const finalGraph = runExec.metadata.executionGraph as ExecutionGraph;
    expect(finalGraph.status).toBe("completed");
    expect(finalGraph.nodes.every((n) => n.status === "completed")).toBe(true);

    // Verify parallel branches detection API
    const parallelBranches = await executionGraphService.getParallelBranches(execId);
    expect(parallelBranches.length).toBeGreaterThanOrEqual(1);
    expect(parallelBranches[0]).toContain(`${execId}-toolB`);
    expect(parallelBranches[0]).toContain(`${execId}-toolC`);
  });

  it("should evaluate conditional edges and prune inactive branches", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Run conditional branches",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const execId = execution.executionId;

    // Inject variable to guide routing
    graph.variables.runBranchB = true;

    // Construct conditional branch: Cap -> ToolB (conditional: runBranchB === true) & ToolC (conditional: runBranchB === false)
    graph.nodes = [
      { id: `${execId}-intent`, name: "Intent", type: "Intent", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-cap`, name: "Capability", type: "Capability", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-toolB`, name: "Tool B", type: "Tool", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-toolC`, name: "Tool C", type: "Tool", status: "queued", config: {}, retryCount: 0, maxRetries: 3 }
    ];

    graph.edges = [
      { id: "e1", source: `${execId}-intent`, target: `${execId}-cap`, type: "sequential", status: "pending" },
      { id: "e2", source: `${execId}-cap`, target: `${execId}-toolB`, type: "conditional", condition: "runBranchB === true", status: "pending" },
      { id: "e3", source: `${execId}-cap`, target: `${execId}-toolC`, type: "conditional", condition: "runBranchB === false", status: "pending" }
    ];

    await (executionRuntimeService as any).repository.save(execution);

    const runExec = await executionRuntimeService.execute(execId);
    expect(runExec.status).toBe("COMPLETED");

    const finalGraph = runExec.metadata.executionGraph as ExecutionGraph;
    const nodeB = finalGraph.nodes.find((n) => n.id === `${execId}-toolB`);
    const nodeC = finalGraph.nodes.find((n) => n.id === `${execId}-toolC`);

    expect(nodeB?.status).toBe("completed");
    expect(nodeC?.status).toBe("cancelled"); // Pruned by conditional branch
  });

  it("should support dynamic node insertion and graph execution", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Dynamic Insertion",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const execId = execution.executionId;

    // Dynamically insert an extra Tool node right after intent node
    const extraNode: ExecutionGraphNode = {
      id: `${execId}-extra`,
      name: "Dynamic Extra Node",
      type: "Tool",
      status: "queued",
      config: { commandType: "dynamic:run" },
      retryCount: 0,
      maxRetries: 3,
    };

    executionGraphService.insertNode(graph, `${execId}-intent`, extraNode);

    // Verify insertion updated connectivity
    const edgeToExtra = graph.edges.find((e) => e.target === extraNode.id);
    const edgeFromExtra = graph.edges.find((e) => e.source === extraNode.id);

    expect(edgeToExtra).toBeDefined();
    expect(edgeToExtra?.source).toBe(`${execId}-intent`);
    expect(edgeFromExtra).toBeDefined();
    expect(edgeFromExtra?.target).toBe(`${execId}-capability`);

    await (executionRuntimeService as any).repository.save(execution);

    // Run the execution and verify the dynamically inserted node completes
    const runExec = await executionRuntimeService.execute(execId);
    expect(runExec.status).toBe("COMPLETED");

    const finalGraph = runExec.metadata.executionGraph as ExecutionGraph;
    const extra = finalGraph.nodes.find((n) => n.id === extraNode.id);
    expect(extra?.status).toBe("completed");
  });

  it("should correctly calculate the critical path of the graph", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Critical Path",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const execId = execution.executionId;

    // Setup node durations: Intent (10ms) -> Cap (20ms) -> ToolB (100ms) & ToolC (10ms) -> Agent (5ms)
    graph.nodes = [
      { id: "node1", name: "Intent", type: "Intent", status: "completed", config: {}, retryCount: 0, maxRetries: 3, durationMs: 10 },
      { id: "node2", name: "Capability", type: "Capability", status: "completed", config: {}, retryCount: 0, maxRetries: 3, durationMs: 20 },
      { id: "node3-long", name: "Tool B", type: "Tool", status: "completed", config: {}, retryCount: 0, maxRetries: 3, durationMs: 100 },
      { id: "node3-short", name: "Tool C", type: "Tool", status: "completed", config: {}, retryCount: 0, maxRetries: 3, durationMs: 10 },
      { id: "node4", name: "Agent", type: "Agent", status: "completed", config: {}, retryCount: 0, maxRetries: 3, durationMs: 5 }
    ];

    graph.edges = [
      { id: "e1", source: "node1", target: "node2", type: "sequential", status: "traversed" },
      { id: "e2", source: "node2", target: "node3-long", type: "parallel", status: "traversed" },
      { id: "e3", source: "node2", target: "node3-short", type: "parallel", status: "traversed" },
      { id: "e4", source: "node3-long", target: "node4", type: "sequential", status: "traversed" },
      { id: "e5", source: "node3-short", target: "node4", type: "sequential", status: "traversed" }
    ];

    await (executionRuntimeService as any).repository.save(execution);

    const criticalPath = await executionGraphService.getCriticalPath(execId);
    expect(criticalPath).toEqual(["node1", "node2", "node3-long", "node4"]);
  });

  it("should merge a child subgraph into the parent graph", async () => {
    const parentExec = await executionRuntimeService.createExecution(
      "Parent Execution",
      { userId: testUser.id, role: testUser.role }
    );
    const parentGraph = parentExec.metadata.executionGraph as ExecutionGraph;

    const childGraph: ExecutionGraph = {
      executionId: "child",
      nodes: [
        { id: "c1", name: "Sub Node 1", type: "Tool", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
        { id: "c2", name: "Sub Node 2", type: "Notification", status: "queued", config: {}, retryCount: 0, maxRetries: 3 }
      ],
      edges: [
        { id: "ce1", source: "c1", target: "c2", type: "sequential", status: "pending" }
      ],
      status: "pending",
      createdAt: new Date().toISOString(),
      variables: { childVar: "val" }
    };

    // Merge childGraph into parentGraph replacing the "Capability" node
    const targetNodeId = `${parentExec.executionId}-capability`;
    executionGraphService.mergeGraphs(parentGraph, childGraph, targetNodeId);

    // Verify Capability node is gone
    const capNode = parentGraph.nodes.find((n) => n.id === targetNodeId);
    expect(capNode).toBeUndefined();

    // Verify subgraph nodes are present and prefixed
    const subNode1 = parentGraph.nodes.find((n) => n.name === "Sub Node 1");
    expect(subNode1).toBeDefined();
    expect(subNode1?.id.startsWith("sub-")).toBe(true);

    // Verify connectivity connects intent -> subNode1 -> subNode2 -> Agent
    const edgeToSub = parentGraph.edges.find((e) => e.source === `${parentExec.executionId}-intent`);
    expect(edgeToSub).toBeDefined();
    expect(edgeToSub?.target).toBe(subNode1?.id);
  });

  it("should produce a valid Mermaid visualization of the graph", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Mermaid Visualizer",
      { userId: testUser.id, role: testUser.role }
    );

    const mermaid = await executionGraphService.visualizeGraphMermaid(execution.executionId);
    expect(mermaid).toContain("graph TD");
    expect(mermaid).toContain("classDef completed");
    expect(mermaid).toContain("Intent Classification");
    expect(mermaid).toContain("Capability Routing");
  });

  it("should recover active/interrupted executions from checkpoint states", async () => {
    const execution = await executionRuntimeService.createExecution(
      "Checkpoint crash recovery",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    
    // Simulate crash where Intent and Capability completed, but Agent is still queued
    execution.status = "RUNNING";
    graph.status = "running";
    graph.nodes[0].status = "completed";
    graph.nodes[1].status = "completed";
    graph.edges[0].status = "traversed";

    await (executionRuntimeService as any).repository.save(execution);

    // Recover executions
    await executionRuntimeService.recoverActiveExecutions();

    // Give asynchronous execution loop a short time to process the recovered graph
    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalExec = await executionRuntimeService.getExecution(execution.executionId);
    expect(finalExec?.status).toBe("COMPLETED");
    expect(finalExec?.metadata.executionGraph.status).toBe("completed");
  });

  it("should pause execution at Human Approval node and resume successfully", async () => {
    const execution = await executionRuntimeService.createExecution(
      "HITL Gate",
      { userId: testUser.id, role: testUser.role }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const execId = execution.executionId;

    // Inject Human Approval node: Intent -> Capability -> Approval -> Agent
    graph.nodes = [
      { id: `${execId}-intent`, name: "Intent", type: "Intent", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-cap`, name: "Capability", type: "Capability", status: "queued", config: {}, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-approval`, name: "Approval Required", type: "Human Approval", status: "queued", config: { approvers: ["admin@aegisos.io"] }, retryCount: 0, maxRetries: 3 },
      { id: `${execId}-agent`, name: "Agent", type: "Agent", status: "queued", config: {}, retryCount: 0, maxRetries: 3 }
    ];

    graph.edges = [
      { id: "e1", source: `${execId}-intent`, target: `${execId}-cap`, type: "sequential", status: "pending" },
      { id: "e2", source: `${execId}-cap`, target: `${execId}-approval`, type: "sequential", status: "pending" },
      { id: "e3", source: `${execId}-approval`, target: `${execId}-agent`, type: "sequential", status: "pending" }
    ];

    await (executionRuntimeService as any).repository.save(execution);

    const runExec = await executionRuntimeService.execute(execId);
    // Should pause at Human Approval node and status should become WAITING
    expect(runExec.status).toBe("WAITING");

    const approvals = await workflowRepository.getApprovals();
    const myApproval = approvals.find((a) => a.executionId === execId && a.status === "pending");
    expect(myApproval).toBeDefined();

    // Approve the gate to resume execution
    await workflowService.actionApproval(myApproval!.id, "admin-operator", "approved");

    // Give tick loop short time to complete remaining nodes
    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalExec = await executionRuntimeService.getExecution(execId);
    expect(finalExec?.status).toBe("COMPLETED");
    expect(finalExec?.metadata.executionGraph.status).toBe("completed");
  });

  it("should wrap existing workflows into single-node execution graphs", async () => {
    const { ProviderRegistry: AliasRegistry } = await import("@/infrastructure/providers/registry");
    const { ProviderRegistry: RelativeRegistry } = await import("../../../src/infrastructure/providers/registry");
    
    const mockProvider = {
      id: "filesystem-provider",
      name: "Mock File System Provider",
      type: "filesystem-provider",
      checkHealth: async () => ({ status: "healthy" as any, latencyMs: 0, lastCheckedAt: new Date().toISOString() }),
      listDirectory: async () => ["file1.txt", "file2.txt"],
    };
    
    AliasRegistry.getInstance().registerProvider(mockProvider as any);
    RelativeRegistry.getInstance().registerProvider(mockProvider as any);

    const workflows = await workflowRepository.getWorkflows();
    const activeWf = workflows.find((w: any) => w.status === "active");
    if (!activeWf) throw new Error("No active workflow seeded in database");

    // Clear executions seeded by getWorkflows -> init (keep dummy complete)
    await prisma.workflowExecution.deleteMany({
      where: { id: { not: "dummy-completed-exec-id" } }
    });

    // Create execution for workflow
    const execution = await executionRuntimeService.createExecution(
      `Trigger workflow: ${activeWf.name}`,
      { userId: testUser.id, role: testUser.role },
      { workflowId: activeWf.id }
    );

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    expect(graph.nodes.length).toBe(3); // Intent -> Capability -> Workflow
    expect(graph.nodes[2].type).toBe("Workflow");
    expect(graph.nodes[2].config.workflowReference.workflowId).toBe(activeWf.id);

    // Manually tick the workflow service executions in a fast loop to bypass 1s delay
    const tickInterval = setInterval(async () => {
      try {
        await (workflowService as any).tickExecutions();
      } catch (err) {
        // ignore
      }
    }, 50);

    try {
      // Run execution and verify it triggers WorkflowService
      const runExec = await executionRuntimeService.execute(execution.executionId);
      expect(runExec.status).toBe("COMPLETED");
      expect(runExec.workflowReference?.runId).toBeDefined();
    } finally {
      clearInterval(tickInterval);
    }
  });
});
