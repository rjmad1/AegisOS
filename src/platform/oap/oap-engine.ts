// src/platform/oap/oap-engine.ts

import * as fs from "fs";
import * as path from "path";

export interface OAPUXMetrics {
  timeToCreateWorkspaceMs: number;
  timeToLaunchMissionMs: number;
  timeToFindArtifactsMs: number;
  timeToLocateKnowledgeMs: number;
  timeToApproveHitlMs: number;
  timeToRecoverExecutionMs: number;
  timeToOnboardProjectMs: number;
}

export interface OAPTelemetryEvent {
  missionId: string;
  domain: "Research" | "Architecture" | "Coding" | "Product Management" | "Documentation" | "Planning" | "Meeting Notes" | "Issue Tracking";
  timestamp: string;
  status: "PASS" | "WARNING" | "FAIL";
  executionTimeMs: number;
  reflectionCycles: number;
  userInterventionCount: number;
  manualCorrections: number;
  agentUtilization: Record<string, number>;
  toolUtilization: Record<string, number>;
  knowledgeReuseRatePercent: number;
  executionGraphNodeCount: number;
  artifactQualityScore: number;
  promptRevisionCount: number;
  recoveryCount: number;
  uxMetrics: OAPUXMetrics;
}

export interface OAPFrictionItem {
  id: string;
  domain: string;
  description: string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "COSMETIC";
  frequency: "ALWAYS" | "FREQUENT" | "OCCASIONAL" | "RARE";
  reproductionSteps: string[];
  subsystem: string;
  suggestedImprovement: string;
  status: "LOGGED" | "TRIAGED" | "IN_PROGRESS" | "RESOLVED" | "VERIFIED";
  backlogTicketId?: string;
}

export interface OAPOperationalScorecard {
  totalMissionsExecuted: number;
  passedMissions: number;
  warningMissions: number;
  failedMissions: number;
  overallSuccessRatePercent: number;
  avgCompletionDurationSeconds: number;
  avgHitlInterventionsPerMission: number;
  avgReflectionCyclesPerMission: number;
  totalManualCorrections: number;
  overallKnowledgeReusePercent: number;
  avgArtifactQualityScore: number;
  executionRecoveryRatePercent: number;
  operationalAdoptionIndex: number; // 0-100
  uxMetricAverages: OAPUXMetrics;
  frictionCountBySeverity: {
    CRITICAL: number;
    MAJOR: number;
    MINOR: number;
    COSMETIC: number;
  };
}

export class OAPEngine {
  private static instance: OAPEngine | null = null;
  private frictionCatalogPath: string;

  private constructor() {
    this.frictionCatalogPath = path.join(process.cwd(), "docs", "oap", "friction_catalog.json");
  }

  public static getInstance(): OAPEngine {
    if (!OAPEngine.instance) {
      OAPEngine.instance = new OAPEngine();
    }
    return OAPEngine.instance;
  }

  public loadFrictionCatalog(): OAPFrictionItem[] {
    if (!fs.existsSync(this.frictionCatalogPath)) {
      return [];
    }
    const raw = fs.readFileSync(this.frictionCatalogPath, "utf-8");
    return JSON.parse(raw) as OAPFrictionItem[];
  }

  public generateSampleTelemetryEvents(): OAPTelemetryEvent[] {
    const domains: OAPTelemetryEvent["domain"][] = [
      "Coding",
      "Research",
      "Architecture",
      "Product Management",
      "Documentation",
      "Planning",
      "Meeting Notes",
      "Issue Tracking",
    ];

    const events: OAPTelemetryEvent[] = [];
    const baseTimestamp = new Date("2026-07-18T08:00:00Z").getTime();

    for (let i = 1; i <= 42; i++) {
      const domain = domains[(i - 1) % domains.length];
      const isWarn = i % 8 === 0;
      const isFail = i === 42;
      const status: "PASS" | "WARNING" | "FAIL" = isFail ? "FAIL" : isWarn ? "WARNING" : "PASS";

      events.push({
        missionId: `OAP-MIS-${1000 + i}`,
        domain,
        timestamp: new Date(baseTimestamp + i * 600000).toISOString(),
        status,
        executionTimeMs: Math.round(12000 + Math.random() * 12000),
        reflectionCycles: status === "PASS" ? 1 : status === "WARNING" ? 2 : 3,
        userInterventionCount: status === "PASS" ? 0 : 1,
        manualCorrections: i === 12 || i === 28 ? 1 : 0,
        agentUtilization: {
          "Intent Engine": 1,
          "Developer Agent": domain === "Coding" ? 2 : 1,
          "Architecture Agent": domain === "Architecture" ? 2 : 1,
          "Governance Agent": 1,
        },
        toolUtilization: {
          "view_file": Math.floor(2 + Math.random() * 4),
          "write_to_file": Math.floor(1 + Math.random() * 2),
          "grep_search": Math.floor(1 + Math.random() * 3),
          "run_command": Math.floor(1 + Math.random() * 2),
        },
        knowledgeReuseRatePercent: Math.round(75 + Math.random() * 20),
        executionGraphNodeCount: Math.floor(3 + Math.random() * 5),
        artifactQualityScore: status === "PASS" ? 98 : status === "WARNING" ? 88 : 65,
        promptRevisionCount: status === "PASS" ? 1 : 2,
        recoveryCount: status === "FAIL" ? 1 : 0,
        uxMetrics: {
          timeToCreateWorkspaceMs: Math.round(2800 + Math.random() * 800),
          timeToLaunchMissionMs: Math.round(1200 + Math.random() * 400),
          timeToFindArtifactsMs: Math.round(1800 + Math.random() * 600),
          timeToLocateKnowledgeMs: Math.round(1500 + Math.random() * 500),
          timeToApproveHitlMs: Math.round(3500 + Math.random() * 1000),
          timeToRecoverExecutionMs: Math.round(6000 + Math.random() * 1500),
          timeToOnboardProjectMs: Math.round(17000 + Math.random() * 3000),
        },
      });
    }

    return events;
  }

  public computeScorecard(events: OAPTelemetryEvent[]): OAPOperationalScorecard {
    const total = events.length;
    const passed = events.filter((e) => e.status === "PASS").length;
    const warning = events.filter((e) => e.status === "WARNING").length;
    const failed = events.filter((e) => e.status === "FAIL").length;

    const successRate = Math.round(((passed + warning * 0.8) / total) * 1000) / 10;
    const avgDuration = Math.round((events.reduce((sum, e) => sum + e.executionTimeMs, 0) / total / 1000) * 10) / 10;
    const avgHitl = Math.round((events.reduce((sum, e) => sum + e.userInterventionCount, 0) / total) * 100) / 100;
    const avgReflection = Math.round((events.reduce((sum, e) => sum + e.reflectionCycles, 0) / total) * 100) / 100;
    const manualCorrections = events.reduce((sum, e) => sum + e.manualCorrections, 0);
    const knowledgeReuse = Math.round((events.reduce((sum, e) => sum + e.knowledgeReuseRatePercent, 0) / total) * 10) / 10;
    const artifactQuality = Math.round((events.reduce((sum, e) => sum + e.artifactQualityScore, 0) / total) * 10) / 10;

    const recoveriesNeeded = events.filter((e) => e.status !== "PASS").length;
    const recoveriesSucceeded = events.filter((e) => e.status === "WARNING" || (e.status === "FAIL" && e.recoveryCount > 0)).length;
    const recoveryRate = recoveriesNeeded > 0 ? Math.round((recoveriesSucceeded / recoveriesNeeded) * 100) : 100;

    const oai = Math.round(
      successRate * 0.35 +
      artifactQuality * 0.25 +
      (100 - avgHitl * 100) * 0.20 +
      knowledgeReuse * 0.20
    );

    const uxAverages: OAPUXMetrics = {
      timeToCreateWorkspaceMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToCreateWorkspaceMs, 0) / total),
      timeToLaunchMissionMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToLaunchMissionMs, 0) / total),
      timeToFindArtifactsMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToFindArtifactsMs, 0) / total),
      timeToLocateKnowledgeMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToLocateKnowledgeMs, 0) / total),
      timeToApproveHitlMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToApproveHitlMs, 0) / total),
      timeToRecoverExecutionMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToRecoverExecutionMs, 0) / total),
      timeToOnboardProjectMs: Math.round(events.reduce((s, e) => s + e.uxMetrics.timeToOnboardProjectMs, 0) / total),
    };

    const frictionItems = this.loadFrictionCatalog();
    const frictionCountBySeverity = {
      CRITICAL: frictionItems.filter((f) => f.severity === "CRITICAL").length,
      MAJOR: frictionItems.filter((f) => f.severity === "MAJOR").length,
      MINOR: frictionItems.filter((f) => f.severity === "MINOR").length,
      COSMETIC: frictionItems.filter((f) => f.severity === "COSMETIC").length,
    };

    return {
      totalMissionsExecuted: total,
      passedMissions: passed,
      warningMissions: warning,
      failedMissions: failed,
      overallSuccessRatePercent: successRate,
      avgCompletionDurationSeconds: avgDuration,
      avgHitlInterventionsPerMission: avgHitl,
      avgReflectionCyclesPerMission: avgReflection,
      totalManualCorrections: manualCorrections,
      overallKnowledgeReusePercent: knowledgeReuse,
      avgArtifactQualityScore: artifactQuality,
      executionRecoveryRatePercent: recoveryRate,
      operationalAdoptionIndex: oai,
      uxMetricAverages: uxAverages,
      frictionCountBySeverity,
    };
  }
}

export const oapEngine = OAPEngine.getInstance();
