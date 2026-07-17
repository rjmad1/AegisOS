// src/platform/control/AutomatedGovernanceEngine.ts
import * as fs from "fs";
import * as path from "path";
import prisma from "../../infrastructure/db/prisma";
import { eventPlatform } from "../event-bus/EventPlatform";
import { platformStateEngine, PlatformState } from "./PlatformStateEngine";
import { policyExecutionEngine, PolicyExecutionReport } from "./PolicyExecutionEngine";
import { engineeringOperationsCenter, EngineeringMetrics } from "./EngineeringOperationsCenter";
import { executiveDecisionCenter, ExecutiveRecommendation } from "./ExecutiveDecisionCenter";
import { platformTransformationOffice, PlatformTransformationOfficeState } from "./PlatformTransformationOffice";

export interface MissionControlReport {
  timestamp: string;
  state: PlatformState;
  policies: PolicyExecutionReport;
  engineering: EngineeringMetrics;
  recommendations: ExecutiveRecommendation[];
  pto?: PlatformTransformationOfficeState;
}

export class AutomatedGovernanceEngine {
  private static instance: AutomatedGovernanceEngine | null = null;
  private readonly storePath = path.resolve(process.cwd(), "databases", "mission_control.json");

  private constructor() {}

  public static getInstance(): AutomatedGovernanceEngine {
    if (!AutomatedGovernanceEngine.instance) {
      AutomatedGovernanceEngine.instance = new AutomatedGovernanceEngine();
    }
    return AutomatedGovernanceEngine.instance;
  }

  /**
   * Run the full automated governance check cycle.
   */
  public async runAutomation(): Promise<MissionControlReport> {
    const timestamp = new Date().toISOString();

    // 1. Gather Unified Platform State
    const state = await platformStateEngine.getPlatformState();

    // 2. Evaluate Policies
    const policies = await policyExecutionEngine.evaluatePolicies(state);

    // 3. Compute Engineering Ops Center Metrics
    const engineering = await engineeringOperationsCenter.getEngineeringMetrics(state, policies);

    // 4. Generate/Update Executive Decisions
    const recommendations = await executiveDecisionCenter.generateRecommendations(state, engineering);

    // 4.5. Generate/Update Platform Transformation Office State
    const pto = await platformTransformationOffice.compileState(state, policies, engineering);

    // 5. Build consolidated Mission Control report (Digital Twin State)
    const report: MissionControlReport = {
      timestamp,
      state,
      policies,
      engineering,
      recommendations,
      pto
    };

    // 6. Persist to file store
    if (typeof window === "undefined") {
      try {
        const dir = path.dirname(this.storePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.storePath, JSON.stringify(report, null, 2), "utf-8");
      } catch (e) {
        console.error("[GovernanceEngine] Failed to write digital twin state:", e);
      }
    }

    // 7. Publish Event telemetry to Event Bus
    try {
      await eventPlatform.publish({
        name: "GovernanceRunCompleted",
        source: "automated-governance-engine",
        version: "v1",
        priority: "medium",
        securityClassification: "internal",
        retentionPolicy: "temp",
        payload: {
          overallPassed: policies.overallPassed,
          criticalViolations: policies.criticalViolationsCount,
          readinessScore: engineering.releaseReadinessScore,
          vulnerabilitiesCount: state.risks.vulnerabilitiesCount,
          todoCount: engineering.technicalDebtTodoCount
        }
      });
    } catch (e) {
      console.warn("[GovernanceEngine] Event bus offline or failed:", e);
    }

    // 8. Enforce policy gates in the DB
    try {
      // Create a persistent audit record of this run
      await prisma.auditLogEntry.create({
        data: {
          id: `gov-${Date.now()}`,
          timestamp,
          userId: "system-governance-engine",
          action: "RUN_GOVERNANCE_AUDIT",
          category: "governance",
          details: JSON.stringify({
            overallPassed: policies.overallPassed,
            readinessScore: engineering.releaseReadinessScore,
            blockers: policies.criticalViolationsCount
          }),
          ipAddress: "127.0.0.1"
        }
      });
    } catch {}

    return report;
  }

  /**
   * Load the latest persisted Mission Control report.
   */
  public loadLatestReport(): MissionControlReport | null {
    if (typeof window !== "undefined") return null;
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("[GovernanceEngine] Failed to load latest state:", e);
    }
    return null;
  }
}

export const automatedGovernanceEngine = AutomatedGovernanceEngine.getInstance();
export default automatedGovernanceEngine;
