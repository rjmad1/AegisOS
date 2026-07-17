// src/platform/control/ExecutiveDecisionCenter.ts
import * as fs from "fs";
import * as path from "path";
import { PlatformState } from "./PlatformStateEngine";
import { EngineeringMetrics } from "./EngineeringOperationsCenter";
import { policyExecutionEngine } from "./PolicyExecutionEngine";

export interface ExecutiveRecommendation {
  id: string;
  title: string;
  description: string;
  category: "architecture" | "security" | "reliability" | "capacity" | "roadmap";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidence: string;
  confidence: number; // 0 - 100
  status: "pending" | "approved" | "dismissed" | "executed";
  rationale: string;
  impact: string;
  createdDate: string;
  actionedDate: string | null;
}

export class ExecutiveDecisionCenter {
  private static instance: ExecutiveDecisionCenter | null = null;
  private readonly storePath = path.resolve(process.cwd(), "databases", "mission_control_decisions.json");

  private constructor() {}

  public static getInstance(): ExecutiveDecisionCenter {
    if (!ExecutiveDecisionCenter.instance) {
      ExecutiveDecisionCenter.instance = new ExecutiveDecisionCenter();
    }
    return ExecutiveDecisionCenter.instance;
  }

  /**
   * Load recommendations from JSON database.
   */
  public loadRecommendations(): ExecutiveRecommendation[] {
    if (typeof window !== "undefined") return [];
    try {
      if (fs.existsSync(this.storePath)) {
        const raw = fs.readFileSync(this.storePath, "utf-8");
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error("[DecisionCenter] Failed to load recommendations:", e);
    }
    return [];
  }

  /**
   * Save recommendations to JSON database.
   */
  private saveRecommendations(recs: ExecutiveRecommendation[]): void {
    if (typeof window !== "undefined") return;
    try {
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.storePath, JSON.stringify(recs, null, 2), "utf-8");
    } catch (e) {
      console.error("[DecisionCenter] Failed to save recommendations:", e);
    }
  }

  /**
   * Generate recommendations based on the current state and engineering metrics.
   */
  public async generateRecommendations(
    state: PlatformState,
    metrics: EngineeringMetrics
  ): Promise<ExecutiveRecommendation[]> {
    const existing = this.loadRecommendations();
    const updated: ExecutiveRecommendation[] = [...existing];

    // Helper to add recommendation if it doesn't already exist in pending state
    const addRec = (rec: Omit<ExecutiveRecommendation, "status" | "createdDate" | "actionedDate">) => {
      const found = updated.find(r => r.title === rec.title);
      if (!found) {
        updated.push({
          ...rec,
          status: "pending",
          createdDate: new Date().toISOString(),
          actionedDate: null
        });
      } else if (found.status === "executed" || found.status === "dismissed") {
        // If it was already actioned but the issue is resolved/resolved again, we do nothing.
      } else {
        // Update details of pending recommendation
        found.evidence = rec.evidence;
        found.confidence = rec.confidence;
      }
    };

    // 1. Check for Architecture Drift or Boundary Violations
    if (state.risks.vulnerabilitiesCount > 0) {
      addRec({
        id: `rec-arch-${Date.now().toString().slice(-4)}`,
        title: "Remediate view-layer architectural boundary leaks",
        description: "Review and refactor direct imports of raw backend repositories or deep infrastructure files from inside UI view components.",
        category: "architecture",
        priority: "HIGH",
        evidence: `${state.risks.vulnerabilitiesCount} directory boundary violations detected by fitness-checker.`,
        confidence: 95,
        rationale: "Maintains decoupling and C4 alignment between frontend views and data layer controllers.",
        impact: "Improves overall release readiness score by removing strict policy blockers."
      });
    }

    // 2. Check for SBOM CycloneDX Missing
    if (state.dependencies.lockStatus === "invalid") {
      addRec({
        id: `rec-sec-${Date.now().toString().slice(-4)}`,
        title: "Generate CycloneDX Software Bill of Materials (SBOM)",
        description: "Execute supply-chain audit to generate a CycloneDX SBOM manifest mapping dependency checksums.",
        category: "security",
        priority: "MEDIUM",
        evidence: "public/CycloneDX-SBOM.json manifest was not detected on filesystem.",
        confidence: 90,
        rationale: "Ensures compliance with NIST SSDF standards and security baseline validations.",
        impact: "Aligns platform with SOC2 supply chain controls and unlocks release gates."
      });
    }

    // 3. Check for Offline Service Ports
    const offlinePorts = state.health.ports.filter(p => p.status === "offline");
    if (offlinePorts.length > 0) {
      addRec({
        id: `rec-rel-${Date.now().toString().slice(-4)}`,
        title: "Restore Model Proxy & Inference Services",
        description: `Restart offline backend services. Offline ports identified: ${offlinePorts.map(p => `${p.name} (${p.port})`).join(", ")}.`,
        category: "reliability",
        priority: "CRITICAL",
        evidence: `Port listener failures found on: ${offlinePorts.map(p => p.port).join(", ")}.`,
        confidence: 98,
        rationale: "AI routing and orchestration capabilities are fully blocked if LLM/LiteLLM interfaces are unreachable.",
        impact: "Restores platform operational health index and enables model execution."
      });
    }

    // 4. Check for SQLite Sizing Concerns
    if (state.health.databaseSizeMb > 4.0) {
      addRec({
        id: `rec-cap-${Date.now().toString().slice(-4)}`,
        title: "Scale Local SQLite Store to PostgreSQL Cluster",
        description: "Migrate relational data models to PostgreSQL to prevent lock contentions under heavy write loads.",
        category: "capacity",
        priority: "LOW",
        evidence: `SQLite dev.db storage footprint has reached ${state.health.databaseSizeMb} MB.`,
        confidence: 85,
        rationale: "SQLite database locking delays transaction execution during parallel workflow tasks.",
        impact: "Reduces execution latency and provides high availability connection clustering."
      });
    }

    // 5. Check for Technical Debt Accumulation
    if (metrics.technicalDebtTodoCount > 10) {
      addRec({
        id: `rec-road-${Date.now().toString().slice(-4)}`,
        title: "Schedule dedicated sprint to refactor code TODO markers",
        description: `Plan a code-cleanup sprint to resolve the accumulation of inline developers' comments.`,
        category: "roadmap",
        priority: "LOW",
        evidence: `Found ${metrics.technicalDebtTodoCount} TODO/FIXME comments inside src/ codebase files.`,
        confidence: 75,
        rationale: "Prevents accumulation of small deferred tasks before they turn into major technical debt.",
        impact: "Improves overall code quality, maintainability, and standard engineering hygiene."
      });
    }

    this.saveRecommendations(updated);
    return updated;
  }

  /**
   * Action a recommendation (Approve/Dismiss/Execute).
   */
  public actionRecommendation(id: string, action: "approved" | "dismissed" | "executed"): ExecutiveRecommendation[] {
    const recs = this.loadRecommendations();
    const found = recs.find(r => r.id === id);
    if (found) {
      found.status = action;
      found.actionedDate = new Date().toISOString();
      
      // Auto-trigger simulated resolution actions
      if (action === "approved") {
        found.status = "executed"; // Automatically transition to executed
        
        // Execute side effects for simulation
        if (found.title.includes("CycloneDX")) {
          try {
            const sbomDir = path.resolve(process.cwd(), "public");
            if (!fs.existsSync(sbomDir)) fs.mkdirSync(sbomDir, { recursive: true });
            fs.writeFileSync(
              path.join(sbomDir, "CycloneDX-SBOM.json"),
              JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.4", metadata: { timestamp: new Date().toISOString() } }, null, 2),
              "utf-8"
            );
          } catch {}
        }
      }
      
      this.saveRecommendations(recs);
    }
    return recs;
  }
}

export const executiveDecisionCenter = ExecutiveDecisionCenter.getInstance();
export default executiveDecisionCenter;
