// ============================================================================
// Knowledge Fabric Service Refactored — Phase 9
// ============================================================================

import {
  KnowledgeEntity,
  Relationship,
  Lineage,
  KnowledgeCollection,
  Topic,
  KnowledgeGraph,
  Reference
} from "@/types/knowledge";

import { knowledgeFabricEngine } from "@/platform/knowledge/KnowledgeFabric";
import { knowledgeGraphEngine } from "@/platform/knowledge/KnowledgeGraphEngine";
import { ragPlatform } from "@/platform/knowledge/RAGPlatform";

class KnowledgeService {
  private static instance: KnowledgeService;
  private initialized = false;

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      this.initialized = true;
      await knowledgeFabricEngine.initialize();
    }
  }

  // --- 1. Entity Registry Access ---
  public async getEntities(options?: { type?: string; search?: string }): Promise<KnowledgeEntity[]> {
    await this.ensureInitialized();
    const graph = knowledgeGraphEngine.exportCanonicalGraph();
    let list = graph.nodes.map(n => ({
      id: n.id,
      type: n.type,
      name: n.label,
      description: n.metadata?.description || n.metadata?.content || "",
      tags: n.metadata?.tags || [],
      createdAt: n.metadata?.createdAt || new Date().toISOString(),
      modifiedAt: n.metadata?.modifiedAt || new Date().toISOString(),
      metadata: n.metadata || {},
      score: {
        semanticScore: n.metadata?.confidence ?? 0.9,
        recencyScore: 0.95,
        frequencyScore: 0.8,
        totalScore: n.metadata?.trustScore ?? 0.85
      }
    }));

    if (options?.type) {
      list = list.filter(e => e.type === options.type);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public async getEntity(id: string): Promise<KnowledgeEntity | null> {
    await this.ensureInitialized();
    const node = knowledgeGraphEngine.getNode(id);
    if (!node) return null;

    return {
      id: node.id,
      type: node.type as any,
      name: node.label,
      description: node.properties?.description || node.properties?.content || "",
      tags: node.properties?.tags || [],
      createdAt: node.properties?.createdAt || new Date().toISOString(),
      modifiedAt: node.properties?.modifiedAt || new Date().toISOString(),
      metadata: {
        owner: node.owner,
        version: node.version,
        confidence: node.confidence,
        trustScore: node.trustScore,
        sourceReferences: node.sourceReferences,
        ...node.properties
      },
      score: {
        semanticScore: node.confidence,
        recencyScore: 0.95,
        frequencyScore: 0.8,
        totalScore: node.trustScore
      }
    };
  }

  // --- 2. Relationship Engine Access ---
  public async getRelationships(): Promise<Relationship[]> {
    await this.ensureInitialized();
    const edges = knowledgeGraphEngine.getRelationships();
    return edges.map(e => ({
      sourceId: e.sourceId,
      targetId: e.targetId,
      type: e.type,
      metadata: {
        id: e.id,
        weight: e.weight,
        trustScore: e.trustScore,
        provenance: e.provenance,
        ...(e.metadata || {})
      }
    }));
  }

  // --- 3. Lineage Engine Access ---
  public async getLineage(entityId: string): Promise<Lineage> {
    await this.ensureInitialized();
    const relations = await this.getRelationships();
    const path: string[] = [entityId];
    const relationships: Relationship[] = [];

    let currentId = entityId;
    let depth = 0;
    const maxDepth = 10;

    // Tracing lineage transitions backward
    while (depth < maxDepth) {
      const edge = relations.find(
        r =>
          r.sourceId === currentId &&
          (r.type === "generated_by" ||
            r.type === "derived_from" ||
            r.type === "belongs_to" ||
            r.type === "triggered_by" ||
            r.type === "references" ||
            r.type === "related_to")
      );

      if (!edge) break;

      path.push(edge.targetId);
      relationships.push(edge);
      currentId = edge.targetId;
      depth++;
    }

    return {
      entityId,
      path,
      relationships
    };
  }

  // --- 4. Virtual Collections Mapping ---
  public async getCollections(): Promise<KnowledgeCollection[]> {
    await this.ensureInitialized();
    const entities = await this.getEntities();

    return [
      {
        id: "col-project",
        name: "Project Workspaces",
        description: "Source code files and repository components.",
        type: "project",
        entityIds: entities.filter(e => (e.type as string) === "file" || (e.type as string) === "project" || (e.type as string) === "code").map(e => e.id)
      },
      {
        id: "col-conversations",
        name: "Conversations Logbook",
        description: "Interactive conversation histories and prompts.",
        type: "conversation",
        entityIds: entities.filter(e => e.type === "conversation" || e.id.startsWith("prompt-")).map(e => e.id)
      },
      {
        id: "col-workflows",
        name: "Workflows & Executions",
        description: "Task executions and agent runs history.",
        type: "workflow",
        entityIds: entities.filter(e => e.type === "workflow" || e.type === "execution").map(e => e.id)
      },
      {
        id: "col-documentation",
        name: "System Documentation & ADRs",
        description: "Static guides, ADR specifications, and guidelines docs.",
        type: "documentation",
        entityIds: entities.filter(e => e.type === "documentation" || (e.type as string) === "adr" || (e.type as string) === "decision").map(e => e.id)
      },
      {
        id: "col-infrastructure",
        name: "Workstation Resources",
        description: "Physical hardware, containers, and database nodes.",
        type: "infrastructure",
        entityIds: entities.filter(e => e.type === "infrastructure").map(e => e.id)
      }
    ];
  }

  // --- 5. Topics Compilation ---
  public async getTopics(): Promise<Topic[]> {
    await this.ensureInitialized();
    const entities = await this.getEntities();
    const tagCounts: Record<string, number> = {};

    entities.forEach(ent => {
      ent.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([name, count]) => ({
        name,
        description: `Topics relating to active ${name} entity nodes.`,
        score: count
      }))
      .sort((a, b) => b.score - a.score);
  }

  // --- 6. Chronological Timeline ---
  public async getTimeline(): Promise<any[]> {
    await this.ensureInitialized();
    const entities = await this.getEntities();

    return entities
      .map(ent => ({
        id: ent.id,
        name: ent.name,
        type: ent.type,
        action: ent.type === "event" ? "bus-fire" : ent.type === "execution" ? "run" : "created",
        timestamp: ent.createdAt,
        description: ent.description
      }))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- 7. Topology Graphs compiles ---
  public async getGraph(): Promise<KnowledgeGraph> {
    await this.ensureInitialized();
    return knowledgeGraphEngine.exportCanonicalGraph();
  }

  // --- 8. Reference mappings lookup ---
  public async getReferences(entityId: string): Promise<{ incoming: Reference[]; outgoing: Reference[] }> {
    await this.ensureInitialized();
    const relations = await this.getRelationships();

    const incoming = relations
      .filter(r => r.targetId === entityId)
      .map(r => ({ sourceId: r.sourceId, targetId: r.targetId, type: r.type }));

    const outgoing = relations
      .filter(r => r.sourceId === entityId)
      .map(r => ({ sourceId: r.sourceId, targetId: r.targetId, type: r.type }));

    return { incoming, outgoing };
  }

  // --- 9. RAG Powered Global Search Upgrade ---
  public async search(query: string): Promise<any[]> {
    await this.ensureInitialized();
    // Forward to RAG search Engine
    const results = await ragPlatform.search({ query, searchType: "hybrid", limit: 25 });
    return results.map(r => ({
      id: r.entity.id,
      type: r.entity.type,
      name: r.entity.name,
      description: r.entity.description,
      tags: r.entity.tags,
      createdAt: r.entity.createdAt,
      modifiedAt: r.entity.modifiedAt,
      metadata: r.entity.metadata,
      score: {
        semanticScore: r.score,
        recencyScore: r.freshnessScore,
        frequencyScore: 0.8,
        totalScore: r.trustScore
      },
      connectionsCount: r.citations.length
    }));
  }
}

export const knowledgeService = KnowledgeService.getInstance();
export default knowledgeService;
