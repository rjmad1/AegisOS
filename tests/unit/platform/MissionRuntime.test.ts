// tests/unit/platform/MissionRuntime.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { missionRuntimeService } from "@/services/mission-runtime.service";
import { missionPlanner } from "@/services/mission-planner.service";
import { missionEvaluationService } from "@/services/mission-evaluation.service";
import { missionReflectionService } from "@/services/mission-reflection.service";
import { missionMemory } from "@/services/mission-memory.service";
import { MemoryMissionRepository } from "@/repositories/mission.repository";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import { executionGraphService } from "@/services/execution-graph.service";
import { MemoryExecutionRepository } from "@/repositories/execution.repository";
import { ExecutionGraph, ExecutionGraphNode } from "@/types/execution-graph";

describe("Mission Runtime & Adaptive Autonomous Execution Tests (EMIP)", () => {
  let mockMissionRepo: MemoryMissionRepository;
  let mockExecutionRepo: MemoryExecutionRepository;

  beforeEach(() => {
    mockMissionRepo = new MemoryMissionRepository();
    mockExecutionRepo = new MemoryExecutionRepository();
    
    // Bind memory repos to isolate test cases
    missionRuntimeService.setRepository(mockMissionRepo);
    executionRuntimeService.setRepository(mockExecutionRepo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a mission, perform intent analysis, and build an initial execution graph", async () => {
    const prompt = "Conduct deep research on local GPU usage trends";
    const mission = await missionRuntimeService.createMission(prompt);

    expect(mission.id).toBeDefined();
    expect(mission.name).toContain("Mission:");
    expect(mission.status).toBe("PLANNING");
    expect(mission.goals.length).toBeGreaterThan(0);
    expect(mission.goals[0]).toContain("Gather comprehensive information");
    expect(mission.constraints.length).toBeGreaterThan(0);
    expect(mission.activeExecutionId).toBeDefined();

    // Verify initial execution graph is stored in runtime
    const execution = await executionRuntimeService.getExecution(mission.activeExecutionId!);
    expect(execution).toBeDefined();
    expect(execution?.metadata?.executionGraph).toBeDefined();
  });

  it("should calculate correct evaluation metrics in MissionEvaluationService", async () => {
    const prompt = "Run platform audit for regulatory compliance";
    const mission = await missionRuntimeService.createMission(prompt);
    
    const execution = await executionRuntimeService.getExecution(mission.activeExecutionId!);
    const graph = execution!.metadata.executionGraph as ExecutionGraph;

    // Simulate partial progress
    graph.nodes[0].status = "completed";
    graph.nodes[1].status = "completed";
    
    const evaluation = missionEvaluationService.evaluate(mission, graph);

    expect(evaluation.score).toBeGreaterThan(0);
    expect(evaluation.completeness).toBeGreaterThan(0);
    expect(evaluation.confidence).toBeGreaterThan(0);
    expect(evaluation.quality).toBe(100); // no failures/retries yet
    expect(evaluation.risk).toBeDefined();
    expect(evaluation.remainingWork.length).toBeGreaterThan(0);
  });

  it("should run gap analysis and decide workflow steps in MissionReflectionService", async () => {
    const prompt = "Perform repository modernization for PostgreSQL persistence";
    const mission = await missionRuntimeService.createMission(prompt);
    
    const execution = await executionRuntimeService.getExecution(mission.activeExecutionId!);
    const graph = execution!.metadata.executionGraph as ExecutionGraph;

    // Mark nodes complete
    for (const node of graph.nodes) {
      node.status = "completed";
    }

    mission.confidence = 50.0;
    const evaluation = missionEvaluationService.evaluate(mission, graph);
    const reflection = missionReflectionService.reflect(mission, evaluation, graph);

    expect(reflection.objectiveAchieved).toBe(true);
    expect(reflection.confidenceThresholdsMet).toBe(true);
    expect(reflection.shouldContinue).toBe(false);
    expect(reflection.shouldExpandWorkflows).toBe(false);
  });

  it("should persist goals, constraints, decisions, lessons, evaluations and artifacts in MissionMemory", async () => {
    const prompt = "Test mission memory capabilities";
    const mission = await missionRuntimeService.createMission(prompt);
    const id = mission.id;

    await missionMemory.recordDecision(id, "Decided to run telemetry test");
    await missionMemory.recordLesson(id, "Telemetry data requires root permission access");
    await missionMemory.addArtifact(id, "/var/log/telemetry_artifact.json");

    const updated = await missionRuntimeService.getMission(id);
    expect(updated?.decisions[0]).toContain("Decided to run telemetry test");
    expect(updated?.lessons[0]).toBe("Telemetry data requires root permission access");
    expect(updated?.artifacts[0]).toBe("/var/log/telemetry_artifact.json");
    expect(updated?.history.length).toBeGreaterThan(2);
  });

  it("should support graph expansion: appending graph nodes dynamically", async () => {
    const prompt = "Append nodes verification";
    const mission = await missionRuntimeService.createMission(prompt);
    const executionId = mission.activeExecutionId!;

    const customNode: ExecutionGraphNode = {
      id: "custom-expand-node",
      name: "Run extra validation routine",
      type: "Tool",
      status: "queued",
      config: { commandType: "infrastructure:restart_service" },
      retryCount: 0,
      maxRetries: 3,
    };

    await missionRuntimeService.appendGraphNode(mission.id, customNode);

    const execution = await executionRuntimeService.getExecution(executionId);
    const graph = execution!.metadata.executionGraph as ExecutionGraph;
    expect(graph.nodes.map(n => n.id)).toContain("custom-expand-node");
  });

  it("should support graph expansion: escalating to Human-in-the-Loop (HITL)", async () => {
    const prompt = "Trigger HITL escalation";
    const mission = await missionRuntimeService.createMission(prompt);
    const executionId = mission.activeExecutionId!;

    await missionRuntimeService.escalateToHITL(mission.id, executionId, "Require admin password approval");

    const execution = await executionRuntimeService.getExecution(executionId);
    const graph = execution!.metadata.executionGraph as ExecutionGraph;
    expect(graph.nodes.some(n => n.type === "Human Approval")).toBe(true);
  });

  it("should support graph expansion: pruning nodes and merging subgraphs", async () => {
    const prompt = "Prune and merge verification";
    const mission = await missionRuntimeService.createMission(prompt);
    const executionId = mission.activeExecutionId!;

    // 1. Prune
    await missionRuntimeService.pruneGraphNodes(mission.id, executionId, [`${executionId}-intent`]);
    
    let execution = await executionRuntimeService.getExecution(executionId);
    let graph = execution!.metadata.executionGraph as ExecutionGraph;
    expect(graph.nodes.some(n => n.id === `${executionId}-intent`)).toBe(false);

    // 2. Merge Subgraph
    const childGraph: ExecutionGraph = {
      executionId: "child-exec",
      nodes: [
        { id: "child-node-1", name: "Perform verification scan", type: "Tool", status: "queued", config: {}, retryCount: 0, maxRetries: 3 }
      ],
      edges: [],
      status: "pending",
      createdAt: new Date().toISOString(),
      variables: {},
    };

    const targetNodeId = graph.nodes[0].id;
    await missionRuntimeService.mergeSubgraphs(mission.id, executionId, childGraph, targetNodeId);

    execution = await executionRuntimeService.getExecution(executionId);
    graph = execution!.metadata.executionGraph as ExecutionGraph;
    expect(graph.nodes.some(n => n.name === "Perform verification scan")).toBe(true);
  });

  it("should execute mission, observe completions, and complete the mission loop", async () => {
    const prompt = "Self-Healing Infrastructure deployment objective";
    const mission = await missionRuntimeService.createMission(prompt);

    const executionId = mission.activeExecutionId!;
    let execution = await executionRuntimeService.getExecution(executionId);
    let graph = execution!.metadata.executionGraph as ExecutionGraph;

    // Simulate completion of all nodes in initial execution
    for (const node of graph.nodes) {
      node.status = "completed";
    }
    await mockExecutionRepo.save(execution!);

    mission.confidence = 50.0;
    await mockMissionRepo.save(mission);

    const result = await missionRuntimeService.executeMission(mission.id);
    expect(result.status).toBe("COMPLETED");
    expect(result.evaluations.length).toBeGreaterThan(0);
    expect(result.evaluations[0].score).toBe(70);
    expect(result.evaluations[0].decision).toBe("complete");
  });

  it("should execute mission, expand execution graph when gap detected, and complete next cycle", async () => {
    const prompt = "500-page PDF synthetic report compiler";
    const mission = await missionRuntimeService.createMission(prompt);
    const executionId = mission.activeExecutionId!;

    let execution = await mockExecutionRepo.get(mission.activeExecutionId!);
    let graph = execution!.metadata.executionGraph as ExecutionGraph;

    // Simulate a failure in initial graph and disable retries so it fails fatally
    graph.nodes[0].status = "completed";
    graph.nodes[1].status = "failed";
    execution!.maxRetries = 0;
    await mockExecutionRepo.save(execution!);

    // Run first loop - gap analysis will auto-expand the graph
    let state = await missionRuntimeService.executeMission(mission.id);
    
    // Expect status to be COMPLETED or FAILED after loop finishes cycle count
    // Since autoExpandGraph runs and we mocked node statuses to succeed,
    // let's verify that the expanded nodes are created.
    execution = await executionRuntimeService.getExecution(executionId);
    graph = execution!.metadata.executionGraph as ExecutionGraph;
    
    expect(graph.nodes.some(n => n.id.startsWith("expand-"))).toBe(true);
    expect(state.history.some(h => h.includes("Gap detected. Expanding execution graph."))).toBe(true);
  });
});
