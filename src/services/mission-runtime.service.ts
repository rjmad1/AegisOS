// src/services/mission-runtime.service.ts

import { executionGraphService } from "./execution-graph.service";
import { executionRuntimeService } from "./execution-runtime.service";
import { missionMemory } from "./mission-memory.service";
import { missionPlanner } from "./mission-planner.service";
import { missionEvaluationService } from "./mission-evaluation.service";
import { missionReflectionService } from "./mission-reflection.service";
import { MissionRepository, SQLiteMissionRepository, PostgresMissionRepository, MemoryMissionRepository } from "../repositories/mission.repository";
import { Mission, MissionEvaluation, MissionReflection, MissionStatus, MissionMetrics } from "../types/mission";
import { ExecutionGraph, ExecutionGraphNode } from "../types/execution-graph";
import * as crypto from "crypto";

export class MissionRuntimeService {
  private static instance: MissionRuntimeService | null = null;
  private repository: MissionRepository;

  private constructor() {
    const provider = process.env.DATABASE_PROVIDER || "sqlite";
    if (process.env.NODE_ENV === "test") {
      this.repository = new MemoryMissionRepository();
    } else if (provider === "postgres" || provider === "postgresql") {
      this.repository = new PostgresMissionRepository();
    } else {
      this.repository = new SQLiteMissionRepository();
    }
  }

  public static getInstance(): MissionRuntimeService {
    if (!MissionRuntimeService.instance) {
      MissionRuntimeService.instance = new MissionRuntimeService();
    }
    return MissionRuntimeService.instance;
  }

  public setRepository(repo: MissionRepository) {
    this.repository = repo;
    missionMemory.setRepository(repo);
  }

  public async getMission(id: string): Promise<Mission | null> {
    return this.repository.get(id);
  }

  /**
   * Creates a mission and initializes planning, intent analysis, and the initial execution graph.
   */
  public async createMission(prompt: string, constraints?: string[], options?: { workspaceId?: string; projectId?: string }): Promise<Mission> {
    const mission = await missionPlanner.planMission(prompt, undefined, options);
    if (constraints && constraints.length > 0) {
      mission.constraints.push(...constraints);
    }
    await this.repository.save(mission);
    return mission;
  }

  /**
   * Triggers the long-running execution and reflection loop.
   */
  public async executeMission(missionId: string): Promise<Mission> {
    const mission = await this.getMission(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    mission.status = "EXECUTING";
    await this.repository.save(mission);
    await missionMemory.addHistoryEvent(missionId, "Mission execution cycle started.");

    let cycleCount = 0;
    const maxCycles = 5; // Prevent infinite loops

    while (mission.status === "EXECUTING" && cycleCount < maxCycles) {
      cycleCount++;
      const activeExecutionId = mission.activeExecutionId;
      if (!activeExecutionId) {
        throw new Error("No active execution ID configured for this mission.");
      }

      await missionMemory.addHistoryEvent(missionId, `Running execution cycle ${cycleCount}...`);
      
      // 1. Run the scheduling & execution
      let execution = await executionRuntimeService.getExecution(activeExecutionId);
      if (!execution) throw new Error(`Execution ${activeExecutionId} not found.`);

      let graph = execution.metadata?.executionGraph as ExecutionGraph;
      if (!graph) {
        graph = executionGraphService.buildGraph(execution);
      }

      // Schedule execution through ExecutionGraphService
      await executionGraphService.schedule(activeExecutionId);
      
      // Refresh execution context after completion
      execution = await executionRuntimeService.getExecution(activeExecutionId);
      if (!execution) {
        throw new Error(`Execution ${activeExecutionId} not found`);
      }
      graph = execution.metadata?.executionGraph as ExecutionGraph;

      // 2. Observe results and update metrics
      const stepFailures = execution.steps.filter((s) => s.status === "failed").length;
      const durationMs = execution.durationMs || 0;
      const costUsd = execution.costMetrics?.actualCostUsd || 0;
      const tokensSpent = execution.costMetrics?.tokensSpent || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

      await missionMemory.updateMetrics(missionId, {
        totalExecutions: mission.metrics.totalExecutions + 1,
        totalDurationMs: mission.metrics.totalDurationMs + durationMs,
        failuresCount: mission.metrics.failuresCount + stepFailures,
        costUsd: mission.metrics.costUsd + costUsd,
        tokensSpent,
      });

      // Register generated artifacts
      if (execution.artifacts) {
        for (const art of execution.artifacts) {
          if (art.filePath) {
            await missionMemory.addArtifact(missionId, art.filePath);
          }
        }
      }

      // Refresh mission copy
      const currentMission = await this.getMission(missionId);
      if (!currentMission) throw new Error(`Mission ${missionId} not found`);

      // 3. Evaluation scorecard
      const evaluation = missionEvaluationService.evaluate(currentMission, graph);
      await missionMemory.recordEvaluation(missionId, evaluation);

      // 4. Reflection & Gap Analysis
      const activeMission = await this.getMission(missionId) || currentMission;
      const reflection = missionReflectionService.reflect(activeMission, evaluation, graph);
      await missionMemory.addHistoryEvent(missionId, `Reflection complete: Achieved: ${reflection.objectiveAchieved}, ShouldContinue: ${reflection.shouldContinue}`);

      if (reflection.objectiveAchieved && evaluation.decision === "complete") {
        activeMission.status = "COMPLETED";
        await this.repository.save(activeMission);
        await missionMemory.recordDecision(missionId, "Goal validation complete. Completing mission.");
        return activeMission;
      }

      if (evaluation.decision === "failed") {
        activeMission.status = "FAILED";
        await this.repository.save(activeMission);
        await missionMemory.recordDecision(missionId, "Max retries or failure thresholds reached. Failing mission.");
        return activeMission;
      }

      if (evaluation.decision === "escalate_hitl") {
        activeMission.status = "REFLECTING"; // Paused waiting for HITL
        await this.repository.save(activeMission);
        await missionMemory.recordDecision(missionId, "Escalating mission execution to Human-in-the-Loop (HITL) review.");
        return activeMission;
      }

      if (evaluation.decision === "expand_graph" || reflection.shouldExpandWorkflows) {
        await missionMemory.recordDecision(missionId, `Gap detected. Expanding execution graph.`);
        
        // Dynamic Graph Expansion based on gaps
        await this.autoExpandGraph(activeMission, graph, evaluation.remainingWork);
        
        // Save the expanded graph back to execution runtime
        execution.metadata.executionGraph = graph;
        execution.status = "RUNNING"; // Reset status to run again
        graph.status = "running";
        await (executionRuntimeService as any).repository.save(execution);
        await executionRuntimeService.recordTimelineEvent(activeExecutionId, "Checkpoint", "system:mission-runtime", "mission-runtime", { graphExpanded: true });
      } else {
        // Fallback: If no gap but not complete, just complete
        activeMission.status = "COMPLETED";
        await this.repository.save(activeMission);
        return activeMission;
      }
    }

    const finalMission = await this.getMission(missionId);
    if (finalMission && finalMission.status === "EXECUTING") {
      finalMission.status = "FAILED";
      await this.repository.save(finalMission);
      await missionMemory.addHistoryEvent(missionId, "Mission execution terminated: Max cycles reached.");
    }
    return finalMission!;
  }

  /**
   * Helper to append nodes to graph for unresolved work items.
   */
  private async autoExpandGraph(mission: Mission, graph: ExecutionGraph, remainingWork: string[]) {
    const lastNode = graph.nodes[graph.nodes.length - 1];
    const prefix = `expand-${crypto.randomUUID().slice(0, 4)}`;

    for (let i = 0; i < remainingWork.length; i++) {
      const work = remainingWork[i];
      let nodeName = `Additional Step: Resolve ${work.slice(0, 30)}`;
      let type: any = "Tool";
      let commandType = "knowledge:refresh_embeddings";

      if (work.toLowerCase().includes("artifact") || work.toLowerCase().includes("report")) {
        nodeName = `Generate Synthetic Report`;
        type = "Artifact";
        commandType = "ai:generate_report";
      } else if (work.toLowerCase().includes("research")) {
        nodeName = `Conduct Deep Research`;
        type = "Agent";
        commandType = "agent:deep_research";
      } else if (work.toLowerCase().includes("modernize") || work.toLowerCase().includes("code")) {
        nodeName = `Refactor Codebase Patterns`;
        type = "Workflow";
        commandType = "workflow:modernize_repo";
      }

      const newNode: ExecutionGraphNode = {
        id: `${prefix}-node-${i}`,
        name: nodeName,
        type,
        status: "queued",
        config: {
          commandType,
          payload: { missionId: mission.id, remainingGap: work },
        },
        retryCount: 0,
        maxRetries: 3,
      };

      // Call executionGraphService to insert this node safely
      executionGraphService.insertNode(graph, lastNode.id, newNode);
    }
  }

  // --- Graph Expansion Capabilities ---

  public async appendGraphNode(missionId: string, node: ExecutionGraphNode): Promise<void> {
    const mission = await this.getMission(missionId);
    if (!mission || !mission.activeExecutionId) return;

    const execution = await executionRuntimeService.getExecution(mission.activeExecutionId);
    if (!execution || !execution.metadata.executionGraph) return;

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    const lastNode = graph.nodes[graph.nodes.length - 1];

    executionGraphService.insertNode(graph, lastNode.id, node);
    await (executionRuntimeService as any).repository.save(execution);
    await executionRuntimeService.recordTimelineEvent(mission.activeExecutionId, "Checkpoint", "system:mission-runtime", "mission-runtime", { nodeAppended: node.id });
    await missionMemory.addHistoryEvent(missionId, `Appended node: ${node.name} to graph.`);
  }

  public async spawnAdditionalGraph(missionId: string, prompt: string): Promise<string> {
    const childExecution = await executionRuntimeService.createExecution(prompt, {
      userId: "system:mission-runtime",
      role: "admin",
    }, { parentExecutionId: missionId });
    
    await missionMemory.addHistoryEvent(missionId, `Spawned additional child graph: ${childExecution.executionId}`);
    return childExecution.executionId;
  }

  public async mergeSubgraphs(missionId: string, parentExecutionId: string, childGraph: ExecutionGraph, targetNodeId: string): Promise<void> {
    const execution = await executionRuntimeService.getExecution(parentExecutionId);
    if (!execution || !execution.metadata.executionGraph) return;

    const parentGraph = execution.metadata.executionGraph as ExecutionGraph;
    executionGraphService.mergeGraphs(parentGraph, childGraph, targetNodeId);
    await (executionRuntimeService as any).repository.save(execution);
    await executionRuntimeService.recordTimelineEvent(parentExecutionId, "Checkpoint", "system:mission-runtime", "mission-runtime", { subgraphMerged: true });
    await missionMemory.addHistoryEvent(missionId, `Merged child graph into parent execution graph at node: ${targetNodeId}`);
  }

  public async pruneGraphNodes(missionId: string, executionId: string, nodeIds: string[]): Promise<void> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return;

    const graph = execution.metadata.executionGraph as ExecutionGraph;
    graph.nodes = graph.nodes.filter((n) => !nodeIds.includes(n.id));
    graph.edges = graph.edges.filter((e) => !nodeIds.includes(e.source) && !nodeIds.includes(e.target));
    
    await (executionRuntimeService as any).repository.save(execution);
    await executionRuntimeService.recordTimelineEvent(executionId, "Checkpoint", "system:mission-runtime", "mission-runtime", { nodesPruned: nodeIds });
    await missionMemory.addHistoryEvent(missionId, `Pruned nodes: ${nodeIds.join(", ")} from graph.`);
  }

  public async escalateToHITL(missionId: string, executionId: string, reason: string): Promise<void> {
    const execution = await executionRuntimeService.getExecution(executionId);
    if (!execution || !execution.metadata.executionGraph) return;
    const graph = execution.metadata.executionGraph as ExecutionGraph;
    
    const hitlNode: ExecutionGraphNode = {
      id: `hitl-${crypto.randomUUID().slice(0, 4)}`,
      name: `HITL Escalation: ${reason}`,
      type: "Human Approval",
      status: "queued",
      config: {
        approvalType: "single",
        approvers: ["admin@aegisos.io"],
        reason,
      },
      retryCount: 0,
      maxRetries: 1,
    };
    
    const lastNode = graph.nodes[graph.nodes.length - 1];
    executionGraphService.insertNode(graph, lastNode.id, hitlNode);
    await (executionRuntimeService as any).repository.save(execution);
    await executionRuntimeService.recordTimelineEvent(executionId, "Checkpoint", "system:mission-runtime", "mission-runtime", { hitlEscalated: true });
    await missionMemory.addHistoryEvent(missionId, `Escalated to HITL: ${reason}`);
  }

  public async scheduleDelayedExecution(missionId: string, delayMs: number): Promise<void> {
    await missionMemory.addHistoryEvent(missionId, `Scheduled delayed execution cycle in ${delayMs}ms.`);
    setTimeout(() => {
      this.executeMission(missionId).catch((err) => {
        console.error(`Delayed mission execution failed for ${missionId}:`, err.message);
      });
    }, delayMs);
  }
}

export const missionRuntimeService = MissionRuntimeService.getInstance();
export default missionRuntimeService;
