// src/services/mission-evaluation.service.ts

import { Mission, MissionEvaluation, MissionMetrics } from "../types/mission";
import { ExecutionGraph } from "../types/execution-graph";

export class MissionEvaluationService {
  private static instance: MissionEvaluationService | null = null;

  private constructor() {}

  public static getInstance(): MissionEvaluationService {
    if (!MissionEvaluationService.instance) {
      MissionEvaluationService.instance = new MissionEvaluationService();
    }
    return MissionEvaluationService.instance;
  }

  /**
   * Evaluates the current state of a mission and generates an evaluation scorecard.
   */
  public evaluate(mission: Mission, activeGraph?: ExecutionGraph): MissionEvaluation {
    const goals = mission.goals || [];
    const metrics = mission.metrics;

    // 1. Mission Completeness
    let completeness = 0;
    if (activeGraph && activeGraph.nodes.length > 0) {
      const completedCount = activeGraph.nodes.filter(
        (n) => n.status === "completed"
      ).length;
      completeness = Math.round((completedCount / activeGraph.nodes.length) * 100);
    } else if (mission.status === "COMPLETED") {
      completeness = 100;
    }

    // 2. Mission Quality
    const retriesCount = activeGraph ? activeGraph.nodes.reduce((sum, n) => sum + (n.retryCount || 0), 0) : 0;
    const failuresCount = metrics.failuresCount || 0;
    let quality = 100 - (failuresCount * 20) - (retriesCount * 5);
    quality = Math.max(0, Math.min(100, Math.round(quality)));

    // 3. Mission Coverage
    // Matches goals against the names of successfully executed graph nodes
    let coverage = 0;
    if (goals.length > 0) {
      let matchedGoals = 0;
      const completedNodeNames = activeGraph
        ? activeGraph.nodes.filter((n) => n.status === "completed").map((n) => n.name.toLowerCase())
        : [];

      for (const goal of goals) {
        const goalLower = goal.toLowerCase();
        // Check if any completed node's name contains a key term from the goal
        const matched = completedNodeNames.some(
          (nodeName) =>
            nodeName.includes(goalLower) ||
            goalLower.includes(nodeName) ||
            this.hasOverlappingTerm(goalLower, nodeName)
        );
        if (matched || mission.status === "COMPLETED") {
          matchedGoals++;
        }
      }
      coverage = Math.round((matchedGoals / goals.length) * 100);
    } else {
      coverage = 100;
    }

    // 4. Mission Risk
    // Based on the executed nodes risk level config and failures
    let risk = 0;
    if (activeGraph) {
      const executedNodes = activeGraph.nodes.filter((n) => n.status === "completed" || n.status === "failed");
      let totalRiskWeight = 0;
      for (const node of executedNodes) {
        const riskLevel = node.config.riskLevel || "LOW";
        if (riskLevel === "CRITICAL") totalRiskWeight += 50;
        else if (riskLevel === "HIGH") totalRiskWeight += 25;
        else if (riskLevel === "MEDIUM") totalRiskWeight += 10;
        else totalRiskWeight += 2;
      }
      risk = totalRiskWeight + (failuresCount * 15);
      risk = Math.max(0, Math.min(100, Math.round(risk)));
    }

    // 5. Remaining Work
    const remainingWork: string[] = [];
    if (activeGraph) {
      const pendingNodes = activeGraph.nodes.filter((n) => n.status === "queued" || n.status === "running" || n.status === "waiting" || n.status === "failed");
      for (const node of pendingNodes) {
        remainingWork.push(`Node '${node.name}' is currently in state '${node.status}'`);
      }
    }
    for (const goal of goals) {
      const goalLower = goal.toLowerCase();
      const completedNodeNames = activeGraph
        ? activeGraph.nodes.filter((n) => n.status === "completed").map((n) => n.name.toLowerCase())
        : [];
      const matched = completedNodeNames.some(
        (nodeName) =>
          nodeName.includes(goalLower) ||
          goalLower.includes(nodeName) ||
          this.hasOverlappingTerm(goalLower, nodeName)
      );
      if (!matched && mission.status !== "COMPLETED") {
        remainingWork.push(`Pending Goal: "${goal}"`);
      }
    }

    // 6. Mission Confidence
    // Function of completeness, quality, coverage, and penalized by risk
    let confidence = (completeness * 0.4) + (quality * 0.3) + (coverage * 0.3) - (risk * 0.1);
    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    // 7. Mission Score
    // Final composite score of execution success
    let score = (completeness * 0.4) + (quality * 0.3) + (coverage * 0.3) - (risk * 0.05);
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine lifecycle next action decision
    let decision: MissionEvaluation["decision"] = "continue";
    if (completeness >= 100 && confidence >= mission.confidence) {
      decision = "complete";
    } else if (failuresCount > 3 || (activeGraph && activeGraph.status === "failed" && retriesCount >= 3)) {
      decision = "failed";
    } else if (activeGraph && activeGraph.nodes.some((n) => n.status === "waiting" || n.type === "Human Approval")) {
      decision = "escalate_hitl";
    } else if (remainingWork.length > 0 && completeness > 0) {
      decision = "expand_graph";
    }

    return {
      timestamp: new Date().toISOString(),
      score,
      confidence,
      completeness,
      quality,
      coverage,
      risk,
      remainingWork,
      decision,
    };
  }

  private hasOverlappingTerm(goal: string, nodeName: string): boolean {
    const goalWords = goal.split(/\s+/).filter((w) => w.length > 4);
    const nodeWords = nodeName.split(/\s+/).filter((w) => w.length > 4);
    return goalWords.some((gw) => nodeWords.some((nw) => nw.includes(gw) || gw.includes(nw)));
  }
}

export const missionEvaluationService = MissionEvaluationService.getInstance();
export default missionEvaluationService;
