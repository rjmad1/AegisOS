// src/services/mission-reflection.service.ts

import { Mission, MissionEvaluation, MissionReflection } from "../types/mission";
import { ExecutionGraph } from "../types/execution-graph";

export class MissionReflectionService {
  private static instance: MissionReflectionService | null = null;

  private constructor() {}

  public static getInstance(): MissionReflectionService {
    if (!MissionReflectionService.instance) {
      MissionReflectionService.instance = new MissionReflectionService();
    }
    return MissionReflectionService.instance;
  }

  /**
   * Performs a comprehensive reflection cycle analyzing gaps between goals and outcomes.
   */
  public reflect(
    mission: Mission,
    evaluation: MissionEvaluation,
    activeGraph?: ExecutionGraph
  ): MissionReflection {
    const gapAnalysis: string[] = [];

    // 1. Was the objective achieved?
    const objectiveAchieved = evaluation.completeness >= 100 && evaluation.score >= mission.confidence;
    if (!objectiveAchieved) {
      gapAnalysis.push(`Completeness is only ${evaluation.completeness}%; goals are not fully achieved.`);
    }

    // 2. Are required artifacts complete?
    // We can assume if the user's objective requires a report or codebase edit, we check if those artifacts were registered.
    const requiresArtifact = mission.goals.some(
      (g) => g.toLowerCase().includes("artifact") || g.toLowerCase().includes("report") || g.toLowerCase().includes("file")
    );
    const artifactsGenerated = mission.artifacts && mission.artifacts.length > 0;
    const artifactsComplete = requiresArtifact ? artifactsGenerated : true;
    if (requiresArtifact && !artifactsGenerated) {
      gapAnalysis.push(`Mission requires generated artifacts (e.g. reports, files), but none are registered yet.`);
    }

    // 3. Are confidence thresholds met?
    const confidenceThresholdsMet = evaluation.confidence >= mission.confidence;
    if (!confidenceThresholdsMet) {
      gapAnalysis.push(`Current confidence (${evaluation.confidence}%) is below the threshold of ${mission.confidence}%.`);
    }

    // 4. Are additional research tasks required?
    // If the graph contains failed nodes or missing context, additional research is required.
    const hasFailures = activeGraph ? activeGraph.nodes.some((n) => n.status === "failed") : false;
    const additionalResearchRequired = hasFailures || evaluation.score < 50;
    if (hasFailures) {
      gapAnalysis.push(`Additional research tasks are required to address node execution failures.`);
    }

    // 5. Did failures affect quality?
    const failuresAffectQuality = hasFailures || (mission.metrics.failuresCount || 0) > 0;
    if (failuresAffectQuality) {
      gapAnalysis.push(`Quality score of ${evaluation.quality}% has been impacted by retry attempts and failure cycles.`);
    }

    // 6. Should execution continue?
    const shouldContinue = evaluation.decision === "continue" || evaluation.decision === "expand_graph";

    // 7. Should new agents be spawned?
    // If we have complex failures or low quality, we spawn helper agents (e.g., deep research or self-healing)
    const shouldSpawnAgents = hasFailures && evaluation.quality < 80;
    if (shouldSpawnAgents) {
      gapAnalysis.push(`Low quality/failures detected. Recommending spawning specialist agents.`);
    }

    // 8. Should workflows be expanded?
    const shouldExpandWorkflows = evaluation.decision === "expand_graph" || (hasFailures && !shouldContinue);
    if (shouldExpandWorkflows) {
      gapAnalysis.push(`Workflow expansion recommended: appending error recovery/resolution paths.`);
    }

    return {
      timestamp: new Date().toISOString(),
      objectiveAchieved,
      artifactsComplete,
      confidenceThresholdsMet,
      additionalResearchRequired,
      failuresAffectQuality,
      shouldContinue,
      shouldSpawnAgents,
      shouldExpandWorkflows,
      gapAnalysis,
    };
  }
}

export const missionReflectionService = MissionReflectionService.getInstance();
export default missionReflectionService;
