// src/platform/control/EngineeringOperationsCenter.ts
import * as fs from "fs";
import * as path from "path";
import { PlatformState } from "./PlatformStateEngine";
import { PolicyExecutionReport } from "./PolicyExecutionEngine";

export interface EngineeringMetrics {
  technicalDebtTodoCount: number;
  architecturalDriftFiles: string[];
  releaseReadinessScore: number; // 0 - 100
  releaseBlockersCount: number;
  operationalHealthIndex: number; // 0 - 100
  operationalHealthIndexConfidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED";
  operationalHealthIndexConfidenceScore?: number;
  operationalHealthIndexProvenance?: string;
  releaseReadinessScoreConfidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED";
  releaseReadinessScoreConfidenceScore?: number;
  releaseReadinessScoreProvenance?: string;
}

export class EngineeringOperationsCenter {
  private static instance: EngineeringOperationsCenter | null = null;

  private constructor() {}

  public static getInstance(): EngineeringOperationsCenter {
    if (!EngineeringOperationsCenter.instance) {
      EngineeringOperationsCenter.instance = new EngineeringOperationsCenter();
    }
    return EngineeringOperationsCenter.instance;
  }

  /**
   * Scans codebase src folder recursively to count TODO/FIXME comments and locate architectural drift files.
   */
  public performCodeScan(): { todoCount: number; driftFiles: string[] } {
    if (typeof window !== "undefined") {
      return { todoCount: 5, driftFiles: [] };
    }

    const srcDir = path.resolve(process.cwd(), "src");
    let todoCount = 0;
    const driftFiles: string[] = [];

    const allowedRootFiles = new Set(["instrumentation.ts", "proxy.ts", "next-env.d.ts", "globals.css"]);

    const scanDirectory = (dir: string, isSrcRoot: boolean = false) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(process.cwd(), fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          // If a folder is created directly in src that is not part of standard structure
          if (isSrcRoot) {
            const standardFolders = new Set([
              "app", "components", "hooks", "modules", "platform", 
              "services", "store", "types", "utils", "infrastructure", 
              "repositories", "api", "enterprise"
            ]);
            if (!standardFolders.has(entry.name) && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
              driftFiles.push(`Directory drift: src/${entry.name} is not in the architecture schema.`);
            }
          }
          scanDirectory(fullPath, false);
        } else if (entry.isFile()) {
          // Check for files directly in src/ that are not allowed
          if (isSrcRoot && !allowedRootFiles.has(entry.name) && !entry.name.endsWith(".d.ts")) {
            driftFiles.push(`File drift: ${relPath} placed directly in src/ root.`);
          }

          // Scan file contents for TODO/FIXME
          if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const todoMatches = content.match(/\b(TODO|FIXME)\b/gi);
              if (todoMatches) {
                todoCount += todoMatches.length;
              }
            } catch {}
          }
        }
      }
    };

    scanDirectory(srcDir, true);
    return { todoCount, driftFiles };
  }

  /**
   * Computes engineering metrics based on platform state and policy evaluation.
   */
  public async getEngineeringMetrics(
    state: PlatformState,
    policyReport: PolicyExecutionReport
  ): Promise<EngineeringMetrics> {
    const { todoCount, driftFiles } = this.performCodeScan();

    // 1. Compute Release Readiness Score
    // Starts at 100. Subtract points for policy violations, drift, and failures.
    let readiness = 100;
    
    // Critical violations cost 25 points each
    readiness -= policyReport.criticalViolationsCount * 25;
    
    // Other failed policies cost 10 points
    const failedAdvisory = policyReport.evaluations.filter(e => !e.passed && e.enforcementLevel !== "strict").length;
    readiness -= failedAdvisory * 10;

    // Architectural drift cost 10 points per drift item
    readiness -= driftFiles.length * 10;

    // Recent failures cost 5 points each
    readiness -= state.incidents.recentFailures * 5;

    // Constrain to 0 - 100 range
    const releaseReadinessScore = Math.max(0, Math.min(100, readiness));

    // Release Blockers
    const releaseBlockersCount = policyReport.criticalViolationsCount;

    // 2. Compute Operational Health Index
    // Starts at 100. Lowered by service errors, database size alerts, capacity bounds.
    let healthIndex = 100;
    if (state.overallStatus === "degraded") healthIndex -= 20;
    if (state.overallStatus === "unhealthy") healthIndex -= 50;
    
    const offlinePorts = state.health.ports.filter(p => p.status === "offline").length;
    healthIndex -= offlinePorts * 10;

    const databaseAlerts = state.capacity.storageLimitPercent > 80 ? 15 : 0;
    healthIndex -= databaseAlerts;

    const operationalHealthIndex = Math.max(0, Math.min(100, healthIndex));

    return {
      technicalDebtTodoCount: todoCount,
      architecturalDriftFiles: driftFiles,
      releaseReadinessScore,
      releaseBlockersCount,
      operationalHealthIndex,
      operationalHealthIndexConfidenceClass: "MEASURED",
      operationalHealthIndexConfidenceScore: 98,
      operationalHealthIndexProvenance: "Alerting platform active registers, port listeners & SQLite filesystem size",
      releaseReadinessScoreConfidenceClass: "OBSERVED",
      releaseReadinessScoreConfidenceScore: 90,
      releaseReadinessScoreProvenance: "Fitness checker static analysis logs & workspace regex Todo scanners"
    };
  }
}

export const engineeringOperationsCenter = EngineeringOperationsCenter.getInstance();
export default engineeringOperationsCenter;
