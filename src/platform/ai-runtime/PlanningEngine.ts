import { ExecutionPlan, SemanticPlanStep } from "./types";

export class PlanningEngine {
  private static instance: PlanningEngine | null = null;

  private constructor() {}

  public static getInstance(): PlanningEngine {
    if (!PlanningEngine.instance) {
      PlanningEngine.instance = new PlanningEngine();
    }
    return PlanningEngine.instance;
  }

  /**
   * Stage 2: Decomposes a target objective (Intent) into structured, purely semantic plan steps.
   * Does NOT resolve execution nodes, executors, or specific workflow implementation details.
   */
  public async createPlan(objective: string, availableCapabilities: string[]): Promise<ExecutionPlan> {
    console.log(`[PlanningEngine] Generating semantic execution plan for objective: "${objective}"`);

    const steps: SemanticPlanStep[] = [
      {
        task: "Scan files and directory layout",
        dependencies: [],
        requiredCapabilities: ["fs:read"],
        expectedOutcome: "A complete map of the current workspace directory",
        priority: "high"
      },
      {
        task: "Query architectural rules and metadata",
        dependencies: ["Scan files and directory layout"],
        requiredCapabilities: ["knowledge:query"],
        expectedOutcome: "List of architectural constraints relevant to the directory layout"
      },
    ];

    if (availableCapabilities.includes("tool:web:search")) {
      steps.push({
        task: "Fetch external security vulnerabilities checklist",
        dependencies: ["Query architectural rules and metadata"],
        requiredCapabilities: ["network:outbound", "tool:web:search"],
        priority: "medium"
      });
    }

    return {
      id: `plan:${Date.now()}`,
      objective,
      steps,
      confidence: 0.94,
    };
  }

  /**
   * Generates a recovery plan when a step fails, injecting alternative semantic routes.
   */
  public async planRecovery(failedTaskName: string, originalPlan: ExecutionPlan): Promise<ExecutionPlan> {
    console.log(`[PlanningEngine] FAILED TASK detected: "${failedTaskName}". Generating healing plan...`);

    const updatedSteps = originalPlan.steps.map(s => s); // shallow copy

    // Inject healing step
    const recoveryStep: SemanticPlanStep = {
      task: `Self-heal failure at ${failedTaskName} by reverting cache and rerouting to backup capability.`,
      dependencies: [failedTaskName],
      expectedOutcome: "System restored to stable state, ready to retry",
      priority: "critical"
    };

    updatedSteps.push(recoveryStep);

    return {
      ...originalPlan,
      id: `plan:healed:${Date.now()}`,
      steps: updatedSteps,
      confidence: 0.88,
    };
  }
}
export default PlanningEngine;
