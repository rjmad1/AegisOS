// ============================================================================
// EKOS Knowledge Governance & Quality Engine — Phase 9
// ============================================================================

import * as fs from "fs";
import * as path from "path";
import { GovernanceRecord, ApprovalStatus } from "@/types/knowledge-fabric";
import { knowledgeGraphEngine } from "./KnowledgeGraphEngine";

export class KnowledgeGovernance {
  private static instance: KnowledgeGovernance | null = null;
  private governanceRecords: Map<string, GovernanceRecord> = new Map();
  private dbPath: string;

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    this.dbPath = path.resolve(dbDir, "knowledge_governance_store.json");
    this.ensureDirectory();
    this.loadGovernanceRecords();
  }

  public static getInstance(): KnowledgeGovernance {
    if (!KnowledgeGovernance.instance) {
      KnowledgeGovernance.instance = new KnowledgeGovernance();
    }
    return KnowledgeGovernance.instance;
  }

  private ensureDirectory() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private loadGovernanceRecords() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const list = JSON.parse(raw) as GovernanceRecord[];
        list.forEach(r => this.governanceRecords.set(r.entityId, r));
      } else {
        this.bootstrapGovernance();
      }
    } catch (err) {
      console.error("[KnowledgeGovernance] Failed to load governance data:", err);
    }
  }

  private saveGovernanceRecords() {
    try {
      const list = Array.from(this.governanceRecords.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.error("[KnowledgeGovernance] Failed to save governance data:", err);
    }
  }

  private bootstrapGovernance() {
    // Bootstrap initial records linked to standard nodes
    const records: GovernanceRecord[] = [
      {
        entityId: "mem:project:aegisos",
        approvalStatus: "certified",
        stewardEmail: "steward-admin@enterprise.org",
        certificationLevel: "gold",
        qualityScore: 0.98,
        completeness: 1.0,
        consistency: 0.95,
        driftDetected: false,
        driftIndex: 0.0,
        reviewedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        reviewedBy: "steward-admin@enterprise.org"
      },
      {
        entityId: "mem:arch:kernel",
        approvalStatus: "certified",
        stewardEmail: "steward-admin@enterprise.org",
        certificationLevel: "gold",
        qualityScore: 0.95,
        completeness: 0.95,
        consistency: 0.95,
        driftDetected: false,
        driftIndex: 0.0,
        reviewedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
        reviewedBy: "steward-admin@enterprise.org"
      },
      {
        entityId: "mem:adr:sqlite-backend",
        approvalStatus: "approved",
        stewardEmail: "steward-admin@enterprise.org",
        certificationLevel: "silver",
        qualityScore: 0.92,
        completeness: 0.9,
        consistency: 0.95,
        driftDetected: false,
        driftIndex: 0.05,
        reviewedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        reviewedBy: "steward-admin@enterprise.org"
      },
      {
        entityId: "mem:req:transaction-isolation",
        approvalStatus: "pending_review",
        stewardEmail: "steward-admin@enterprise.org",
        certificationLevel: "bronze",
        qualityScore: 0.8,
        completeness: 0.8,
        consistency: 0.8,
        driftDetected: true,
        driftIndex: 0.15,
        reviewedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        reviewedBy: "steward-admin@enterprise.org"
      }
    ];

    records.forEach(r => this.governanceRecords.set(r.entityId, r));
    this.saveGovernanceRecords();
  }

  // --- Core Methods ---
  public getRecord(entityId: string): GovernanceRecord | null {
    return this.governanceRecords.get(entityId) || null;
  }

  public getRecords(): GovernanceRecord[] {
    return Array.from(this.governanceRecords.values());
  }

  public setRecord(record: GovernanceRecord): void {
    this.governanceRecords.set(record.entityId, record);
    this.saveGovernanceRecords();
  }

  // --- 1. Quality & Completeness checking ---
  public runQualityCheck(entityId: string): GovernanceRecord {
    const node = knowledgeGraphEngine.getNode(entityId);
    const existing = this.governanceRecords.get(entityId);

    if (!node) {
      throw new Error(`Node '${entityId}' not found in Graph Engine.`);
    }

    // Completeness: checking if description, tags, and properties exist
    let completeness = 0;
    if (node.label) completeness += 0.25;
    if (node.properties?.description || node.properties?.content) completeness += 0.25;
    if (node.owner) completeness += 0.25;
    if (node.sourceReferences && node.sourceReferences.length > 0) completeness += 0.25;

    // Consistency check against ontology rules
    let consistency = 1.0;
    const relations = knowledgeGraphEngine.getRelationships();
    const incidentRels = relations.filter(r => r.sourceId === entityId || r.targetId === entityId);
    
    // Check if relations violate ontology mapping
    incidentRels.forEach(r => {
      const src = knowledgeGraphEngine.getNode(r.sourceId);
      const tgt = knowledgeGraphEngine.getNode(r.targetId);
      if (src && tgt) {
        const valResult = knowledgeGraphEngine.validateRelationship(src.type, tgt.type, r.type);
        if (!valResult.isValid) {
          consistency -= 0.2;
        }
      }
    });
    consistency = Math.max(0, consistency);

    // Drift index: simulated computation based on last checked/modified timestamps
    const daysSinceMod = (Date.now() - new Date(node.properties?.modifiedAt || Date.now()).getTime()) / 86400000;
    const driftIndex = Math.min(1.0, parseFloat((daysSinceMod / 90).toFixed(2))); // 90 days threshold
    const driftDetected = driftIndex > 0.4;

    const qualityScore = parseFloat(((completeness * 0.4 + consistency * 0.4 + (1 - driftIndex) * 0.2)).toFixed(2));

    const govRecord: GovernanceRecord = {
      entityId,
      approvalStatus: existing?.approvalStatus ?? "pending_review",
      stewardEmail: existing?.stewardEmail ?? node.owner ?? "unassigned@enterprise.org",
      certificationLevel: existing?.certificationLevel ?? "none",
      qualityScore,
      completeness,
      consistency,
      driftDetected,
      driftIndex,
      duplicateOf: existing?.duplicateOf,
      reviewedAt: existing?.reviewedAt ?? new Date().toISOString(),
      reviewedBy: existing?.reviewedBy ?? "system-auditor@enterprise.org"
    };

    this.governanceRecords.set(entityId, govRecord);
    this.saveGovernanceRecords();
    return govRecord;
  }

  // --- 2. Trust Score framework ---
  public computeTrustScore(entityId: string): number {
    const record = this.governanceRecords.get(entityId);
    const node = knowledgeGraphEngine.getNode(entityId);

    if (!node) return 0.5;

    // Quality check if record doesn't exist
    const gov = record || this.runQualityCheck(entityId);

    let certWeight = 0;
    switch (gov.certificationLevel) {
      case "gold": certWeight = 1.0; break;
      case "silver": certWeight = 0.85; break;
      case "bronze": certWeight = 0.7; break;
      case "none": certWeight = 0.5; break;
    }

    let approvalWeight = 0.5;
    if (gov.approvalStatus === "certified" || gov.approvalStatus === "approved") {
      approvalWeight = 1.0;
    } else if (gov.approvalStatus === "pending_review") {
      approvalWeight = 0.75;
    } else if (gov.approvalStatus === "deprecated" || gov.approvalStatus === "expired") {
      approvalWeight = 0.2;
    }

    const confidenceScore = node.confidence ?? 0.8;

    // Trust Score formula: 30% Quality, 30% Certification, 20% Approval Status, 20% confidence
    const finalTrust = gov.qualityScore * 0.3 + certWeight * 0.3 + approvalWeight * 0.2 + confidenceScore * 0.2;
    
    // Update node's trust score in graph engine
    node.trustScore = parseFloat(finalTrust.toFixed(2));
    
    return node.trustScore;
  }

  // --- 3. Duplicate Detection & Merging ---
  public detectDuplicates(entityId: string): string[] {
    const targetNode = knowledgeGraphEngine.getNode(entityId);
    if (!targetNode) return [];

    const duplicates: string[] = [];
    const allNodes = knowledgeGraphEngine.getNodes();

    allNodes.forEach(node => {
      if (node.id === entityId) return;

      // 1. Text match comparison on labels
      if (node.label.toLowerCase() === targetNode.label.toLowerCase()) {
        duplicates.push(node.id);
        return;
      }

      // 2. Similarity of descriptions/contents (simulated overlap)
      const desc1 = (targetNode.properties?.description || "").toLowerCase();
      const desc2 = (node.properties?.description || "").toLowerCase();
      if (desc1.length > 10 && desc2.length > 10 && (desc1.includes(desc2) || desc2.includes(desc1))) {
        duplicates.push(node.id);
      }
    });

    return duplicates;
  }

  public mergeEntities(masterId: string, duplicateId: string): boolean {
    const master = knowledgeGraphEngine.getNode(masterId);
    const dup = knowledgeGraphEngine.getNode(duplicateId);

    if (!master || !dup) return false;

    // 1. Tag duplicates in governance records
    const dupGov = this.governanceRecords.get(duplicateId) || this.runQualityCheck(duplicateId);
    dupGov.duplicateOf = masterId;
    dupGov.approvalStatus = "deprecated";
    this.governanceRecords.set(duplicateId, dupGov);

    // 2. Relink edges going to duplicateId to masterId
    const relationships = knowledgeGraphEngine.getRelationships();
    relationships.forEach(rel => {
      let changed = false;
      if (rel.sourceId === duplicateId) {
        rel.sourceId = masterId;
        changed = true;
      }
      if (rel.targetId === duplicateId) {
        rel.targetId = masterId;
        changed = true;
      }
      if (changed) {
        rel.provenance += ` | Merged duplicate connection from ${duplicateId}`;
      }
    });

    this.saveGovernanceRecords();
    console.log(`[Governance] Merged duplicate node ${duplicateId} into master node ${masterId}`);
    return true;
  }
}

export const knowledgeGovernance = KnowledgeGovernance.getInstance();
export default knowledgeGovernance;
