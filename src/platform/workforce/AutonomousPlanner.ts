export interface Plan {
  id: string;
  goalId: string;
  steps: string[];
  simulatedInTwin: boolean;
  riskScore: number;
}

export class AutonomousPlanner {
  private static instance: AutonomousPlanner | null = null;
  private plans: Map<string, Plan> = new Map();

  private constructor() {}

  public static getInstance(): AutonomousPlanner {
    if (!AutonomousPlanner.instance) {
      AutonomousPlanner.instance = new AutonomousPlanner();
    }
    return AutonomousPlanner.instance;
  }

  public simulatePlan(goalId: string, steps: string[]): Plan {
    const plan: Plan = {
      id: Math.random().toString(36).substring(7),
      goalId,
      steps,
      simulatedInTwin: true,
      riskScore: 0.1 // Simulated low risk
    };
    this.plans.set(plan.id, plan);
    return plan;
  }

  public getPlan(id: string): Plan | undefined {
    return this.plans.get(id);
  }
}

export const autonomousPlanner = AutonomousPlanner.getInstance();
