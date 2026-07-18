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

    // 3. Define Goals and Constraints dynamically based on prompt / scenario
    const goals: string[] = [];
    const constraints: string[] = [
      "Max cost: $5.00 USD",
      "Max executions: 5",
      "Strict security firewall inspection active",
    ];

    const promptLower = prompt.toLowerCase();
    if (promptLower.includes("modernization") || promptLower.includes("modernize")) {
      goals.push(
        "Modernize repository patterns to support SQLite/Postgre persistence",
        "Implement relational ORM adapters using Prisma",
        "Verify compiled codebases against MultiTenant validation suites"
      );
    } else if (promptLower.includes("research")) {
      goals.push(
        "Gather comprehensive information on the requested topic",
        "Synthesize structured markdown artifacts summarizing key findings",
        "Achieve confidence thresholds of at least 85%"
      );
    } else if (promptLower.includes("500-page") || promptLower.includes("report")) {
      goals.push(
        "Ingest large-scale source documents and context books",
        "Synthesize structured PDF/Markdown draft chapters",
        "Run formatting validations to ensure zero syntax gaps"
      );
    } else if (promptLower.includes("architecture") || promptLower.includes("audit")) {
      goals.push(
        "Audit tenant networks, role policies, and resource quotas",
        "Verify architectural boundaries against structural rules",
        "Document risk scores and remaining security debt"
      );
    } else if (promptLower.includes("self-healing") || promptLower.includes("fault")) {
      goals.push(
        "Monitor container health and hardware telemetry metrics",
        "Apply auto-healing strategies and saga compensations upon failure",
        "Lockout malicious or looping component behaviors"
      );
    } else {
      goals.push(
        `Achieve user intent: '${intent.name}'`,
        `Complete execution steps: ${plan.steps.map((s) => s.description).join(", ")}`
      );
    }

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
