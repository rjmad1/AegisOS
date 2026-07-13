// ============================================================================
// EKOS Knowledge Analytics & Health Framework — Phase 9
// ============================================================================

import { ReadinessReport, TechDebtItem } from "@/types/knowledge-fabric";
import { knowledgeGraphEngine } from "./KnowledgeGraphEngine";
import { knowledgeGovernance } from "./KnowledgeGovernance";
import { organizationalIntelligence } from "./OrganizationalIntelligence";

export class KnowledgeAnalytics {
  private static instance: KnowledgeAnalytics | null = null;

  private constructor() {}

  public static getInstance(): KnowledgeAnalytics {
    if (!KnowledgeAnalytics.instance) {
      KnowledgeAnalytics.instance = new KnowledgeAnalytics();
    }
    return KnowledgeAnalytics.instance;
  }

  /**
   * Compiles the Knowledge Readiness Report.
   */
  public compileReadinessReport(): ReadinessReport {
    const nodes = knowledgeGraphEngine.getNodes();
    const edges = knowledgeGraphEngine.getRelationships();
    const govRecords = knowledgeGovernance.getRecords();
    const gaps = organizationalIntelligence.runKnowledgeGapAnalysis();

    const totalEntities = nodes.length;
    const totalRelationships = edges.length;

    // Density: edges / nodes (or 0 if zero nodes)
    const graphDensity = totalEntities > 0 ? parseFloat((totalRelationships / totalEntities).toFixed(2)) : 0;

    const certifiedEntitiesCount = govRecords.filter(r => r.approvalStatus === "certified").length;
    const dataQualityAverage = govRecords.length > 0
      ? parseFloat((govRecords.reduce((sum, r) => sum + r.qualityScore, 0) / govRecords.length).toFixed(2))
      : 0.85;

    const averageTrustScore = nodes.length > 0
      ? parseFloat((nodes.reduce((sum, n) => sum + (n.trustScore ?? 0.85), 0) / nodes.length).toFixed(2))
      : 0.85;

    const knowledgeGapCount = gaps.filter(g => g.riskRating === "critical" || g.riskRating === "high").length;

    // Readiness formula: 30% quality average, 30% trust average, 20% certification ratio, 20% gap mitigation
    const certificationRatio = totalEntities > 0 ? certifiedEntitiesCount / totalEntities : 0;
    const gapMitigationRatio = gaps.length > 0 ? (gaps.length - knowledgeGapCount) / gaps.length : 1.0;

    const overallScore = Math.round(
      (dataQualityAverage * 0.3 + averageTrustScore * 0.3 + certificationRatio * 0.2 + gapMitigationRatio * 0.2) * 100
    );

    return {
      overallScore: Math.min(100, Math.max(0, overallScore)),
      graphDensity,
      totalEntities,
      totalRelationships,
      certifiedEntitiesCount,
      dataQualityAverage,
      averageTrustScore,
      knowledgeGapCount
    };
  }

  /**
   * Compiles the Technical Debt Register.
   */
  public getTechnicalDebtRegister(): TechDebtItem[] {
    const nodes = knowledgeGraphEngine.getNodes();
    const govRecords = knowledgeGovernance.getRecords();
    const debtItems: TechDebtItem[] = [];

    nodes.forEach(node => {
      const gov = govRecords.find(r => r.entityId === node.id);

      // 1. Missing Owner Debt
      if (!node.owner || node.owner === "unassigned@enterprise.org" || node.owner === "system") {
        debtItems.push({
          id: `debt-owner-${node.id}`,
          entityId: node.id,
          entityName: node.label,
          debtType: "missing_owner",
          remediationCost: "low",
          description: `Node '${node.label}' is managed by system or unassigned. Requires stewardship ownership mapping.`
        });
      }

      // 2. Low Trust / Low Quality Debt
      if (node.trustScore && node.trustScore < 0.75) {
        debtItems.push({
          id: `debt-trust-${node.id}`,
          entityId: node.id,
          entityName: node.label,
          debtType: "low_trust",
          remediationCost: "medium",
          description: `Node '${node.label}' has a low trust score (${node.trustScore}). Requires manual metadata audit.`
        });
      }

      // 3. Stale / Drifted Content Debt
      if (gov && gov.driftDetected) {
        debtItems.push({
          id: `debt-stale-${node.id}`,
          entityId: node.id,
          entityName: node.label,
          debtType: "stale_content",
          remediationCost: "medium",
          description: `Node '${node.label}' has content drift index (${gov.driftIndex}). Requires validation verification.`
        });
      }

      // 4. Uncertified Debt
      if (!gov || gov.certificationLevel === "none" || gov.certificationLevel === undefined) {
        debtItems.push({
          id: `debt-uncertified-${node.id}`,
          entityId: node.id,
          entityName: node.label,
          debtType: "uncertified",
          remediationCost: "low",
          description: `Node '${node.label}' does not possess certification level credentials.`
        });
      }
    });

    return debtItems;
  }
}

export const knowledgeAnalytics = KnowledgeAnalytics.getInstance();
export default knowledgeAnalytics;
