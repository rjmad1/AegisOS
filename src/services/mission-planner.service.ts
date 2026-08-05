// src/services/mission-planner.service.ts

import { Mission, MissionMetrics } from "../types/mission";
import { intentClassifier } from "../platform/assistant/IntentClassifier";
import { taskPlanner } from "../platform/assistant/TaskPlanner";
import { executionGraphService } from "./execution-graph.service";
import { executionRuntimeService } from "./execution-runtime.service";
import * as crypto from "crypto";

export class MissionPlanner {
  private static instance: MissionPlanner | null = null;

  private constructor() {}

  public static getInstance(): MissionPlanner {
    if (!MissionPlanner.instance) {
      MissionPlanner.instance = new MissionPlanner();
    }
    return MissionPlanner.instance;
  }

  /**
   * Plans a new mission: extracts goals/constraints, performs intent analysis, and creates the execution graph.
   */
  public async planMission(prompt: string, id?: string, options?: { workspaceId?: string; projectId?: string }): Promise<Mission> {
    const missionId = id || `mission-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    // 1. Intent Analysis
    const { intent, entities } = intentClassifier.classify(prompt);

    // 2. Generate Plan Steps
    const plan = taskPlanner.generatePlan(intent, entities);

    // 3. Define Goals and Constraints dynamically based on user prompt and generated plan steps
    const goals: string[] = [];
    const promptLower = prompt.toLowerCase();
    if (promptLower.includes("research")) {
      goals.push("Gather comprehensive information on the requested topic");
    }
    goals.push(
      `Achieve user intent: '${intent.name}'`,
      ...plan.steps.map((s) => s.description)
    );
    const constraints: string[] = [
      "Max cost: $5.00 USD",
      "Max executions: 5",
      "Strict security firewall inspection active",
    ];

    // 4. Create baseline execution context
    const execution = await executionRuntimeService.createExecution(prompt, {
      userId: "system:mission-planner",
      role: "admin",
    }, {
      workspaceId: options?.workspaceId,
      projectId: options?.projectId,
    });

    // createExecution automatically handles intent analysis, planning, graph building and persistence

    // 6. Initialize Mission Metrics
    const metrics: MissionMetrics = {
      totalExecutions: 0,
      totalDurationMs: 0,
      failuresCount: 0,
      costUsd: 0,
      tokensSpent: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };

    return {
      id: missionId,
      name: `Mission: ${prompt.slice(0, 40)}${prompt.length > 40 ? "..." : ""}`,
      goals,
      constraints,
      status: "PLANNING",
      history: [`[${now}] Mission created and registered.`, `[${now}] Goals planned: ${goals.join("; ")}`],
      decisions: [],
      artifacts: [],
      evaluations: [],
      confidence: 80.0, // default confidence threshold
      lessons: [],
      metrics,
      createdAt: now,
      updatedAt: now,
      activeExecutionId: execution.executionId,
      workspaceId: options?.workspaceId,
      projectId: options?.projectId,
    } as any;
  }
}

export const missionPlanner = MissionPlanner.getInstance();
export default missionPlanner;
