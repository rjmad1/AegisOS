// ============================================================================
// EKOS Decision Intelligence Platform — Phase 9
// ============================================================================

import * as fs from "fs";
import * as path from "path";
import { DecisionNode } from "@/types/knowledge-fabric";

export class DecisionIntelligence {
  private static instance: DecisionIntelligence | null = null;
  private decisions: Map<string, DecisionNode> = new Map();
  private dbPath: string;

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    this.dbPath = path.resolve(dbDir, "decision_intel_store.json");
    this.ensureDirectory();
    this.loadDecisions();
  }

  public static getInstance(): DecisionIntelligence {
    if (!DecisionIntelligence.instance) {
      DecisionIntelligence.instance = new DecisionIntelligence();
    }
    return DecisionIntelligence.instance;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadDecisions() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const list = JSON.parse(raw) as DecisionNode[];
        list.forEach(d => this.decisions.set(d.id, d));
      } else {
        this.bootstrapDecisions();
      }
    } catch (err) {
      console.error("[DecisionIntelligence] Failed to load decisions:", err);
    }
  }

  private saveDecisions() {
    try {
      const list = Array.from(this.decisions.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[DecisionIntelligence] Failed to save decisions:", err);
    }
  }

  private bootstrapDecisions() {
    const defaultDecisions: DecisionNode[] = [
      {
        id: "dec-adr-001",
        type: "architecture",
        title: "ADR-001: Implement Modular Platform Kernel with service DI",
        description: "Decided to leverage ServiceRegistry and PlatformKernel modules architecture to enable decoupled development of security, audits, and workflows.",
        status: "accepted",
        ownerEmail: "arch-leads@enterprise.org",
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        requirementIds: ["req-platform-kernel"],
        codeFilePaths: ["src/platform/kernel/PlatformKernel.ts", "src/platform/kernel/ServiceRegistry.ts"],
        testFilePaths: ["src/platform/kernel/PlatformKernel.test.ts"],
        riskIds: ["risk-circular-dependencies"],
        projectIds: ["project-openclaw"]
      },
      {
        id: "dec-sec-002",
        type: "security",
        title: "SEC-002: Zero-Trust Cryptographic Secret Salting",
        description: "Decided to encrypt environment configurations using AES-256-GCM and unique IV salts for every key, preventing credential leaks.",
        status: "accepted",
        ownerEmail: "steward-admin@enterprise.org",
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        requirementIds: ["req-secret-vault"],
        codeFilePaths: ["src/repositories/secret.repository.ts"],
        testFilePaths: [],
        riskIds: ["risk-compromised-keys"],
        projectIds: ["project-openclaw"]
      },
      {
        id: "dec-inc-003",
        type: "incident",
        title: "INC-003: Auto-recovery on event loop stagnation",
        description: "Mitigated server freeze events by implementing healthcheck sub-process checks and container self-healing boot-cycles.",
        status: "accepted",
        ownerEmail: "steward-admin@enterprise.org",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        requirementIds: [],
        codeFilePaths: ["src/platform/health/PlatformHealth.ts"],
        testFilePaths: [],
        riskIds: ["risk-system-stagnation"],
        projectIds: ["project-openclaw"]
      }
    ];

    defaultDecisions.forEach(d => this.decisions.set(d.id, d));
    this.saveDecisions();
  }

  // --- API Methods ---
  public getDecisions(): DecisionNode[] {
    return Array.from(this.decisions.values());
  }

  public getDecision(id: string): DecisionNode | null {
    return this.decisions.get(id) || null;
  }

  public addDecision(decision: DecisionNode): void {
    this.decisions.set(decision.id, decision);
    this.saveDecisions();
  }

  /**
   * Links decision nodes to requirement, code file, test file, or risk.
   */
  public linkToDecision(decisionId: string, type: "requirement" | "code" | "test" | "risk", value: string): boolean {
    const dec = this.decisions.get(decisionId);
    if (!dec) return false;

    if (type === "requirement") {
      if (!dec.requirementIds.includes(value)) dec.requirementIds.push(value);
    } else if (type === "code") {
      if (!dec.codeFilePaths.includes(value)) dec.codeFilePaths.push(value);
    } else if (type === "test") {
      if (!dec.testFilePaths.includes(value)) dec.testFilePaths.push(value);
    } else if (type === "risk") {
      if (!dec.riskIds.includes(value)) dec.riskIds.push(value);
    }

    this.saveDecisions();
    return true;
  }
}

export const decisionIntelligence = DecisionIntelligence.getInstance();
export default decisionIntelligence;
