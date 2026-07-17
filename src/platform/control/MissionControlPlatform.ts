// src/platform/control/MissionControlPlatform.ts
import { platformStateEngine, PlatformState } from "./PlatformStateEngine";
import { policyExecutionEngine, PolicyExecutionReport } from "./PolicyExecutionEngine";
import { engineeringOperationsCenter, EngineeringMetrics } from "./EngineeringOperationsCenter";
import { executiveDecisionCenter, ExecutiveRecommendation } from "./ExecutiveDecisionCenter";
import { automatedGovernanceEngine, MissionControlReport } from "./AutomatedGovernanceEngine";

export class MissionControlPlatform {
  private static instance: MissionControlPlatform | null = null;

  private constructor() {}

  public static getInstance(): MissionControlPlatform {
    if (!MissionControlPlatform.instance) {
      MissionControlPlatform.instance = new MissionControlPlatform();
    }
    return MissionControlPlatform.instance;
  }

  /**
   * Triggers a full automated run and updates the platform Digital Twin.
   */
  public async executeGovernanceCycle(): Promise<MissionControlReport> {
    return await automatedGovernanceEngine.runAutomation();
  }

  /**
   * Retrieves the current state of Mission Control (loads latest report or runs if none exists).
   */
  public async getReport(): Promise<MissionControlReport> {
    const latest = automatedGovernanceEngine.loadLatestReport();
    if (latest) {
      return latest;
    }
    // Fallback: run it now
    return await this.executeGovernanceCycle();
  }

  /**
   * Actions an executive recommendation.
   */
  public actionRecommendation(id: string, action: "approved" | "dismissed" | "executed"): ExecutiveRecommendation[] {
    const recs = executiveDecisionCenter.actionRecommendation(id, action);
    
    // Automatically trigger state refresh so the digital twin updates immediately
    if (typeof window === "undefined") {
      this.executeGovernanceCycle().catch((err) => {
        console.error("[MissionControl] Failed to refresh state after action:", err);
      });
    }
    
    return recs;
  }
}

export const missionControlPlatform = MissionControlPlatform.getInstance();
export default missionControlPlatform;
