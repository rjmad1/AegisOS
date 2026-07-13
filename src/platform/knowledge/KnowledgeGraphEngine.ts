// ============================================================================
// EKOS Knowledge Graph & Ontology Engine — Phase 9
// ============================================================================

import { PropertyNode, AdvancedRelationship } from "@/types/knowledge-fabric";
import { KnowledgeNode, KnowledgeEdge, RelationshipType } from "@/types/knowledge";

export class KnowledgeGraphEngine {
  private static instance: KnowledgeGraphEngine | null = null;
  
  // Property Node Store
  private nodes: Map<string, PropertyNode> = new Map();
  // Edge Store
  private edges: Map<string, AdvancedRelationship> = new Map();

  private constructor() {
    this.initializeDefaultOntology();
  }

  public static getInstance(): KnowledgeGraphEngine {
    if (!KnowledgeGraphEngine.instance) {
      KnowledgeGraphEngine.instance = new KnowledgeGraphEngine();
    }
    return KnowledgeGraphEngine.instance;
  }

  // --- Ontology Engine Schema Definitions ---
  private validRelationshipMappings: Record<string, string[]> = {
    "generated_by": ["artifact", "message", "event", "execution"],
    "derived_from": ["artifact", "code", "document"],
    "references": ["artifact", "decision", "adr", "requirement", "document", "code"],
    "depends_on": ["workflow", "code", "infrastructure", "project", "agent"],
    "uses": ["agent", "execution", "workflow", "tool"],
    "produces": ["execution", "workflow", "agent"],
    "consumes": ["execution", "workflow", "agent"],
    "belongs_to": ["conversation", "message", "infrastructure", "user", "file", "capability"],
    "executed_by": ["execution", "job"],
    "triggered_by": ["execution", "workflow", "event"],
    "contains": ["project", "organization", "document", "workflow"],
    "related_to": ["event", "issue", "risk", "decision"],
    "parent": ["entity", "capability"],
    "child": ["entity", "capability"],
    "version_of": ["artifact", "code", "document", "settings"],
    "supersedes": ["artifact", "decision", "adr", "code"],
    "duplicate_of": ["artifact", "document", "issue", "risk"]
  };

  /**
   * Ontology Verification: Check if relationship matches valid schema constraints.
   */
  public validateRelationship(sourceType: string, targetType: string, type: string): { isValid: boolean; error?: string } {
    const validSources = this.validRelationshipMappings[type];
    if (!validSources) {
      return { isValid: true }; // Custom types allowed, warning logged
    }
    // Simple verification check - returns true if source type is acceptable
    if (validSources.length > 0 && !validSources.includes(sourceType)) {
      return {
        isValid: false,
        error: `Ontology Violation: Relationship '${type}' cannot originate from type '${sourceType}'. Valid sources: [${validSources.join(", ")}]`
      };
    }
    return { isValid: true };
  }

  private initializeDefaultOntology() {
    console.log("[OntologyEngine] Schema schemas and constraints loaded.");
  }

  // --- Node CRUD Operations ---
  public addNode(node: PropertyNode): void {
    this.nodes.set(node.id, {
      ...node,
      trustScore: node.trustScore ?? 0.85,
      confidence: node.confidence ?? 0.9,
      version: node.version ?? "1.0"
    });
  }

  public getNode(id: string): PropertyNode | null {
    return this.nodes.get(id) || null;
  }

  public getNodes(): PropertyNode[] {
    return Array.from(this.nodes.values());
  }

  public deleteNode(id: string): void {
    this.nodes.delete(id);
    // Cascade delete connections
    for (const [edgeId, edge] of this.edges.entries()) {
      if (edge.sourceId === id || edge.targetId === id) {
        this.edges.delete(edgeId);
      }
    }
  }

  // --- Relationship CRUD Operations ---
  public addRelationship(rel: AdvancedRelationship): { success: boolean; error?: string } {
    const src = this.nodes.get(rel.sourceId);
    const tgt = this.nodes.get(rel.targetId);

    if (!src || !tgt) {
      return { success: false, error: `Invalid relationship: Source '${rel.sourceId}' or Target '${rel.targetId}' node does not exist.` };
    }

    // Verify constraints using Ontology Engine
    const validation = this.validateRelationship(src.type, tgt.type, rel.type);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    this.edges.set(rel.id, {
      ...rel,
      trustScore: rel.trustScore ?? 0.9,
      weight: rel.weight ?? 1.0
    });
    return { success: true };
  }

  public getRelationships(): AdvancedRelationship[] {
    return Array.from(this.edges.values());
  }

  // --- Sub-Graph Graph Traversals & Exports ---
  public exportCanonicalGraph(): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const canonicalNodes: KnowledgeNode[] = Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      label: n.label,
      type: n.type as any,
      status: n.properties?.status || "healthy",
      metadata: {
        owner: n.owner,
        version: n.version,
        confidence: n.confidence,
        trustScore: n.trustScore,
        sourceReferences: n.sourceReferences,
        ...n.properties
      }
    }));

    const canonicalEdges: KnowledgeEdge[] = Array.from(this.edges.values()).map(e => ({
      source: e.sourceId,
      target: e.targetId,
      label: e.type,
      type: e.type.replace("_", "-")
    }));

    return { nodes: canonicalNodes, edges: canonicalEdges };
  }

  /**
   * Filter sub-graphs by domains: e.g. "capability", "observability", "workflow"
   */
  public getSubGraph(subgraphType: string): { nodes: PropertyNode[]; edges: AdvancedRelationship[] } {
    const filteredNodes = Array.from(this.nodes.values()).filter(n => {
      switch (subgraphType) {
        case "capability": return n.type === "capability" || n.properties?.domain === "organization";
        case "workflow": return n.type === "workflow" || n.type === "execution" || n.type === "tool";
        case "agent": return n.type === "agent" || n.type === "model" || n.type === "tool";
        case "prompt": return n.properties?.category === "prompt" || n.id.startsWith("prompt-");
        case "infrastructure": return n.type === "infrastructure";
        case "security": return n.properties?.securityClassification !== undefined || n.type === "security";
        case "observability": return n.type === "event" || n.type === "log" || n.properties?.logs !== undefined;
        case "repository": return n.type === "file" || n.type === "artifact" || n.type === "code";
        default: return true;
      }
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = Array.from(this.edges.values()).filter(
      e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId)
    );

    return { nodes: filteredNodes, edges: filteredEdges };
  }
}

export const knowledgeGraphEngine = KnowledgeGraphEngine.getInstance();
export default knowledgeGraphEngine;
