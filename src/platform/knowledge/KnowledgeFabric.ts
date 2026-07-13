// ============================================================================
// EKOS Knowledge Fabric Central Orchestrator — Phase 9
// ============================================================================

import { ProviderRegistry } from "@/infrastructure/providers/registry";
import { IKnowledgeProvider } from "@/infrastructure/contracts/knowledge-providers";
import { knowledgeGraphEngine } from "./KnowledgeGraphEngine";
import { semanticMemoryPlatform } from "./SemanticMemory";
import { knowledgeGovernance } from "./KnowledgeGovernance";
import { organizationalIntelligence } from "./OrganizationalIntelligence";
import { decisionIntelligence } from "./DecisionIntelligence";
import { PropertyNode, AdvancedRelationship } from "@/types/knowledge-fabric";

export class KnowledgeFabricEngine {
  private static instance: KnowledgeFabricEngine | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): KnowledgeFabricEngine {
    if (!KnowledgeFabricEngine.instance) {
      KnowledgeFabricEngine.instance = new KnowledgeFabricEngine();
    }
    return KnowledgeFabricEngine.instance;
  }

  /**
   * Bootstrap the entire Knowledge Operating System, ingesting initial entities
   * from the legacy providers and setting up cross-links.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    console.log("[KnowledgeFabricEngine] Initializing cognitive layers...");

    try {
      // 1. Ingest nodes from Semantic Memory Platform
      const memoryCells = semanticMemoryPlatform.getMemoryCells();
      memoryCells.forEach(cell => {
        const node: PropertyNode = {
          id: cell.id,
          label: cell.name,
          type: cell.type,
          properties: {
            content: cell.content,
            createdAt: cell.createdAt,
            modifiedAt: cell.modifiedAt,
            sourceUri: cell.sourceUri,
            linkedMemoryIds: cell.linkedMemoryIds,
            ...(cell.metadata || {})
          },
          lineageId: cell.id,
          version: cell.metadata?.version || "1.0",
          owner: cell.ownerId || "system",
          confidence: cell.confidence,
          trustScore: cell.trustScore,
          sourceReferences: [cell.sourceUri]
        };
        knowledgeGraphEngine.addNode(node);

        // Run governance checks
        knowledgeGovernance.runQualityCheck(cell.id);
        knowledgeGovernance.computeTrustScore(cell.id);
      });

      // 2. Ingest nodes from Decision Intelligence Platform
      const decisions = decisionIntelligence.getDecisions();
      decisions.forEach(dec => {
        const node: PropertyNode = {
          id: dec.id,
          label: dec.title,
          type: "decision",
          properties: {
            description: dec.description,
            status: dec.status,
            createdAt: dec.createdAt,
            requirementIds: dec.requirementIds,
            codeFilePaths: dec.codeFilePaths,
            testFilePaths: dec.testFilePaths,
            riskIds: dec.riskIds,
            projectIds: dec.projectIds
          },
          lineageId: dec.id,
          version: "1.0",
          owner: dec.ownerEmail,
          confidence: 0.95,
          trustScore: 0.95,
          sourceReferences: [`adr://${dec.id}`]
        };
        knowledgeGraphEngine.addNode(node);

        // Run governance checks
        knowledgeGovernance.runQualityCheck(dec.id);
        knowledgeGovernance.computeTrustScore(dec.id);
      });

      // 3. Ingest nodes from Organizational Intelligence (Capabilities)
      const capabilities = organizationalIntelligence.getCapabilities();
      capabilities.forEach(cap => {
        const node: PropertyNode = {
          id: cap.id,
          label: cap.name,
          type: "capability",
          properties: {
            description: cap.description,
            maturityLevel: cap.maturityLevel,
            ownerTeam: cap.ownerTeam,
            domainName: cap.domainName
          },
          lineageId: cap.id,
          version: "1.0",
          owner: cap.ownerTeam,
          confidence: 1.0,
          trustScore: 0.9,
          sourceReferences: [`capability://${cap.id}`]
        };
        knowledgeGraphEngine.addNode(node);

        // Run governance checks
        knowledgeGovernance.runQualityCheck(cap.id);
        knowledgeGovernance.computeTrustScore(cap.id);
      });

      // 4. Ingest nodes dynamically from legacy IKnowledgeProviders (taps files, containers, logs, etc.)
      const registry = ProviderRegistry.getInstance();
      const providers = registry.getProvidersByType("knowledge-provider");

      for (const prov of providers) {
        try {
          const kProv = prov as unknown as IKnowledgeProvider;
          const kEntities = await kProv.getEntities();
          
          kEntities.forEach(ent => {
            if (!knowledgeGraphEngine.getNode(ent.id)) {
              const node: PropertyNode = {
                id: ent.id,
                label: ent.name,
                type: ent.type,
                properties: {
                  description: ent.description,
                  tags: ent.tags,
                  createdAt: ent.createdAt,
                  modifiedAt: ent.modifiedAt,
                  ...(ent.metadata || {})
                },
                lineageId: ent.id,
                version: ent.metadata?.version || "1.0",
                owner: ent.metadata?.owner || "system",
                confidence: 0.85,
                trustScore: 0.85,
                sourceReferences: ent.metadata?.location ? [ent.metadata.location] : []
              };
              knowledgeGraphEngine.addNode(node);

              // Quality Check & Trust Compute
              knowledgeGovernance.runQualityCheck(ent.id);
              knowledgeGovernance.computeTrustScore(ent.id);
            }
          });
        } catch (err) {
          console.warn(`[KnowledgeFabricEngine] Legacy provider ${prov.id} ingest failed:`, err);
        }
      }

      // 5. Establish links & relationships in the graph
      this.rebuildGraphRelationships();

      console.log(`[KnowledgeFabricEngine] Successfully ingested ${knowledgeGraphEngine.getNodes().length} nodes and established ${knowledgeGraphEngine.getRelationships().length} edges.`);
    } catch (err) {
      console.error("[KnowledgeFabricEngine] Initialization failed:", err);
    }
  }

  /**
   * Scan all nodes and compile the relationship edges dynamically.
   */
  public rebuildGraphRelationships(): void {
    const nodes = knowledgeGraphEngine.getNodes();

    // Reset relations
    // We keep existing if they were added manually, but rebuild structural ones
    nodes.forEach(node => {
      // Establish semantic memory links
      if (node.properties?.linkedMemoryIds) {
        const links = node.properties.linkedMemoryIds as string[];
        links.forEach(linkId => {
          const target = knowledgeGraphEngine.getNode(linkId);
          if (target) {
            const relId = `rel:${node.id}:${linkId}`;
            const rel: AdvancedRelationship = {
              id: relId,
              sourceId: node.id,
              targetId: linkId,
              type: this.deduceRelationshipType(node.type, target.type),
              weight: 1.0,
              trustScore: 0.95,
              provenance: "Ingested semantic memory linking"
            };
            knowledgeGraphEngine.addRelationship(rel);
          }
        });
      }

      // Establish decision links (code files, requirements, risks)
      if (node.type === "decision") {
        const reqs = node.properties?.requirementIds as string[] || [];
        const codes = node.properties?.codeFilePaths as string[] || [];
        const risks = node.properties?.riskIds as string[] || [];

        reqs.forEach(reqId => {
          const target = knowledgeGraphEngine.getNode(reqId);
          if (target) {
            knowledgeGraphEngine.addRelationship({
              id: `rel:${node.id}:${reqId}`,
              sourceId: node.id,
              targetId: reqId,
              type: "references",
              weight: 1.0,
              trustScore: 0.9,
              provenance: "Ingested Decision Requirement mapping"
            });
          }
        });

        codes.forEach(codePath => {
          // Find matching code file node
          const target = nodes.find(n => n.id.includes(codePath) || codePath.includes(n.id));
          if (target) {
            knowledgeGraphEngine.addRelationship({
              id: `rel:${node.id}:${target.id}`,
              sourceId: node.id,
              targetId: target.id,
              type: "references",
              weight: 1.0,
              trustScore: 0.9,
              provenance: "Ingested Decision Code mapping"
            });
          }
        });

        risks.forEach(riskId => {
          const target = knowledgeGraphEngine.getNode(riskId);
          if (target) {
            knowledgeGraphEngine.addRelationship({
              id: `rel:${node.id}:${riskId}`,
              sourceId: node.id,
              targetId: riskId,
              type: "related_to",
              weight: 1.0,
              trustScore: 0.85,
              provenance: "Ingested Decision Risk mapping"
            });
          }
        });
      }

      // Establish Capability-SME links
      if (node.type === "capability") {
        const experts = organizationalIntelligence.getExperts();
        experts.forEach(exp => {
          if (exp.capabilityIds.includes(node.id)) {
            // Find or add SME user node
            const userNodeId = `usr-${exp.userId}`;
            if (!knowledgeGraphEngine.getNode(userNodeId)) {
              knowledgeGraphEngine.addNode({
                id: userNodeId,
                label: exp.name,
                type: "user",
                properties: { email: exp.email, role: exp.role },
                lineageId: userNodeId,
                version: "1.0",
                owner: exp.email,
                confidence: 1.0,
                trustScore: 1.0,
                sourceReferences: []
              });
            }

            knowledgeGraphEngine.addRelationship({
              id: `rel:${userNodeId}:${node.id}`,
              sourceId: userNodeId,
              targetId: node.id,
              type: "uses", // SME uses/owns capability
              weight: 1.2,
              trustScore: 0.95,
              provenance: "Ingested Capability SME mapping"
            });
          }
        });
      }
    });
  }

  private deduceRelationshipType(srcType: string, tgtType: string): string {
    if (srcType === "adr" && tgtType === "requirement") return "references";
    if (srcType === "requirement" && tgtType === "risk") return "related_to";
    if (srcType === "code" && tgtType === "architecture") return "references";
    if (srcType === "project" && tgtType === "architecture") return "contains";
    return "related_to";
  }

  // --- Pipeline Ingestion Operations ---
  public async ingestContent(
    id: string,
    type: string,
    name: string,
    content: string,
    owner: string,
    sourceUri: string,
    metadata: Record<string, any> = {}
  ): Promise<PropertyNode> {
    const node: PropertyNode = {
      id,
      label: name,
      type,
      properties: {
        content,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        sourceUri,
        ...metadata
      },
      lineageId: id,
      version: metadata.version || "1.0",
      owner,
      confidence: metadata.confidence ?? 0.9,
      trustScore: 0.85,
      sourceReferences: [sourceUri]
    };

    knowledgeGraphEngine.addNode(node);
    
    // Quality check & compute trust
    knowledgeGovernance.runQualityCheck(id);
    knowledgeGovernance.computeTrustScore(id);

    // Rebuild links
    this.rebuildGraphRelationships();

    return node;
  }
}

export const knowledgeFabricEngine = KnowledgeFabricEngine.getInstance();
export default knowledgeFabricEngine;
