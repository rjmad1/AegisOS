// ============================================================================
// EKOS Organizational Intelligence Platform — Phase 9
// ============================================================================

import * as fs from "fs";
import * as path from "path";
import { CapabilityNode, SMEProfile, KnowledgeGapReport } from "@/types/knowledge-fabric";

export class OrganizationalIntelligence {
  private static instance: OrganizationalIntelligence | null = null;
  private capabilities: Map<string, CapabilityNode> = new Map();
  private experts: Map<string, SMEProfile> = new Map();
  private dbPath: string;

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    this.dbPath = path.resolve(dbDir, "organizational_intel_store.json");
    this.ensureDirectory();
    this.loadIntelRecords();
  }

  public static getInstance(): OrganizationalIntelligence {
    if (!OrganizationalIntelligence.instance) {
      OrganizationalIntelligence.instance = new OrganizationalIntelligence();
    }
    return OrganizationalIntelligence.instance;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadIntelRecords() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const parsed = JSON.parse(raw);
        
        const caps = parsed.capabilities as CapabilityNode[] || [];
        const exps = parsed.experts as SMEProfile[] || [];
        
        caps.forEach(c => this.capabilities.set(c.id, c));
        exps.forEach(e => this.experts.set(e.userId, e));
      } else {
        this.bootstrapIntel();
      }
    } catch (err) {
      console.error("[OrganizationalIntelligence] Failed to load records:", err);
    }
  }

  private saveIntelRecords() {
    try {
      const data = {
        capabilities: Array.from(this.capabilities.values()),
        experts: Array.from(this.experts.values())
      };
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[OrganizationalIntelligence] Failed to save records:", err);
    }
  }

  private bootstrapIntel() {
    const caps: CapabilityNode[] = [
      { id: "cap-security-auditing", name: "Security Auditing & Audit Trails", description: "Audit trail compliance validations, hashing, and event-bus integrity verification.", maturityLevel: 4, ownerTeam: "SecOps", domainName: "Security" },
      { id: "cap-ai-orchestration", name: "Multi-Agent AI Runtime Orchestration", description: "Orchestration, prompt construction, and local model fine-tuning and served models.", maturityLevel: 5, ownerTeam: "AI-Core", domainName: "AI Services" },
      { id: "cap-database-ops", name: "Relational Database Infrastructure", description: "SQLite, Prisma schema definitions, transaction isolation, and backups lifecycle.", maturityLevel: 3, ownerTeam: "Db-Admins", domainName: "Infrastructure" }
    ];

    const exps: SMEProfile[] = [
      { userId: "usr-admin-01", name: "Dr. Raja Kumar", email: "steward-admin@enterprise.org", role: "Principal AI Architect", expertDomains: ["AI Services", "Security"], capabilityIds: ["cap-ai-orchestration", "cap-security-auditing"], confidence: 0.98 },
      { userId: "usr-operator-02", name: "Dev Engineer", email: "operator-dev@enterprise.org", role: "Database Engineer", expertDomains: ["Infrastructure"], capabilityIds: ["cap-database-ops"], confidence: 0.85 }
    ];

    caps.forEach(c => this.capabilities.set(c.id, c));
    exps.forEach(e => this.experts.set(e.userId, e));
    this.saveIntelRecords();
  }

  // --- API Methods ---
  public getCapabilities(): CapabilityNode[] {
    return Array.from(this.capabilities.values());
  }

  public getExperts(): SMEProfile[] {
    return Array.from(this.experts.values());
  }

  // --- SME Identification & Expert Discovery ---
  public findSMEForDomain(domain: string): SMEProfile[] {
    return Array.from(this.experts.values()).filter(exp => 
      exp.expertDomains.some(d => d.toLowerCase() === domain.toLowerCase())
    );
  }

  // --- Knowledge Gap Analysis ---
  public runKnowledgeGapAnalysis(): KnowledgeGapReport[] {
    const domains = ["Security", "AI Services", "Infrastructure", "Compliance", "Observability"];
    const reports: KnowledgeGapReport[] = [];

    domains.forEach(d => {
      const expertCount = this.findSMEForDomain(d).length;
      let documentationCount = 0;

      // Simulated documentation check based on filesystem or database records
      if (d === "Security") documentationCount = 3;
      else if (d === "AI Services") documentationCount = 4;
      else if (d === "Infrastructure") documentationCount = 2;

      let riskRating: KnowledgeGapReport["riskRating"] = "low";
      let desc = `Domain '${d}' has sufficient expert coverage and documented specifications.`;

      if (expertCount === 0 && documentationCount === 0) {
        riskRating = "critical";
        desc = `Critical risk: zero experts and zero documents registered for domain '${d}'.`;
      } else if (expertCount === 0) {
        riskRating = "high";
        desc = `High risk: domain '${d}' has specifications but no active expert SME profiles assigned.`;
      } else if (documentationCount === 0) {
        riskRating = "medium";
        desc = `Medium risk: domain '${d}' has active experts but lacks formal architectural specifications.`;
      }

      reports.push({
        domain: d,
        expertCount,
        documentationCount,
        riskRating,
        description: desc
      });
    });

    return reports;
  }
}

export const organizationalIntelligence = OrganizationalIntelligence.getInstance();
export default organizationalIntelligence;
