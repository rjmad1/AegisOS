import { ExecutionPlan, PlanStep } from "./types";

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
   * Decomposes a target objective into structured plan steps with allocated tools.
   */
  public async createPlan(goal: string, availableTools: string[]): Promise<ExecutionPlan> {
    console.log(`[PlanningEngine] Generating execution plan for goal: "${goal}"`);

    const steps: PlanStep[] = [
      {
        id: "plan-step-1",
        action: "Scan files and directory layout",
        target: "fs:root",
        dependencies: [],
        status: "pending",
      },
      {
        id: "plan-step-2",
        action: "Query architectural rules and metadata",
        target: "know:adr:001",
        dependencies: ["plan-step-1"],
        status: "pending",
      },
    ];

    // Allocate tool if outbound network is available
    if (availableTools.includes("tool:web:search")) {
      steps.push({
        id: "plan-step-3",
        action: "Fetch external security vulnerabilities checklist",
        target: "tool:web:search",
        dependencies: ["plan-step-2"],
        status: "pending",
      });
    }

    return {
      id: `plan:${Date.now()}`,
      goal,
      steps,
      confidence: 0.94,
    };
  }

  /**
   * Self-Healing Planner:
   * Generates a recovery plan when a step fails, injecting alternative routes.
   */
  public async planRecovery(failedStepId: string, originalPlan: ExecutionPlan): Promise<ExecutionPlan> {
    console.log(`[PlanningEngine] FAILED STEP detected: "${failedStepId}". Generating healing plan...`);

    const updatedSteps = originalPlan.steps.map((s) => {
      if (s.id === failedStepId) {
        return { ...s, status: "failed" as const };
      }
      return s;
    });

    // Inject healing step
    const recoveryStep: PlanStep = {
      id: `plan-step-recovery-${Date.now()}`,
      action: `Self-heal failure at ${failedStepId} by reverting cache and rerouting to backup model.`,
      target: "system:self-heal",
      dependencies: [failedStepId],
      status: "pending",
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
