// ============================================================================
// Knowledge Fabric Observability Service — Phase 8
// ============================================================================

import {
  KnowledgeEntity,
  KnowledgeEntityType,
  Relationship,
  RelationshipType,
  Lineage,
  KnowledgeCollection,
  Topic,
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  Reference
} from "@/types/knowledge";
import { ProviderRegistry } from "@/infrastructure/providers/registry";
import { IKnowledgeProvider } from "@/infrastructure/contracts/knowledge-providers";
import { runtimeService } from "./runtime.service";
import { infrastructureService } from "./infrastructure.service";

class KnowledgeService {
  private static instance: KnowledgeService;
  private cache: { entities: KnowledgeEntity[]; timestamp: number } | null = null;
  private cacheTTL = 5000; // 5 seconds cache to balance performance with live event changes

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  // --- 1. Knowledge Ingestion & Registry (Step 3 & 1) ---
  public async getEntities(options?: { type?: string; search?: string }): Promise<KnowledgeEntity[]> {
    const now = Date.now();
    if (this.cache && now - this.cache.timestamp < this.cacheTTL) {
      return this.filterEntities(this.cache.entities, options);
    }

    const entities: KnowledgeEntity[] = [];

    // A. Query all registered Knowledge Providers in the Registry
    const registry = ProviderRegistry.getInstance();
    const providers = registry.getProvidersByType("knowledge-provider");

    for (const prov of providers) {
      try {
        const kProv = prov as unknown as IKnowledgeProvider;
        const kEntities = await kProv.getEntities();
        entities.push(...kEntities);
      } catch (err) {
        console.error(`[KnowledgeService] Provider ${prov.id} failed to return entities:`, err);
      }
    }

    // B. Synthesize Agents, Tools, Providers directly from internal runtime registries
    try {
      const agents = await runtimeService.getAgents();
      agents.forEach(a => {
        entities.push({
          id: a.id,
          type: "agent",
          name: a.name,
          description: a.role || `Autonomous AI agent running model ${a.model}.`,
          tags: ["active", a.status, ...a.capabilities],
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          modifiedAt: new Date().toISOString(),
          metadata: {
            status: a.status,
            tools: a.tools,
            model: a.model,
            capabilities: a.capabilities
          }
        });
      });
    } catch {}

    try {
      const tools = await runtimeService.getTools();
      tools.forEach(t => {
        entities.push({
          id: `tool-${t.name}`,
          type: "tool",
          name: t.name,
          description: t.description || "Orchestration tool executable by runtime agents.",
          tags: ["utility", t.category || "general", t.provider],
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          modifiedAt: new Date().toISOString(),
          metadata: {
            category: t.category,
            provider: t.provider,
            inputSchema: t.inputSchema,
            outputSchema: t.outputSchema,
            status: t.status
          }
        });
      });
    } catch {}

    // C. Synthesize Infrastructure elements from the Infrastructure Service
    try {
      const host = await infrastructureService.getHost();
      entities.push({
        id: "host-node",
        type: "infrastructure",
        name: host.hostname,
        description: `Physical Workstation Node running ${host.operatingSystem.version}.`,
        tags: ["hardware", "workstation"],
        createdAt: new Date(Date.now() - 864000000).toISOString(),
        modifiedAt: new Date().toISOString(),
        metadata: {
          uptime: host.uptime,
          timezone: host.timezone,
          cpuBrand: host.cpu.brand,
          totalMemory: host.memory.total
        }
      });

      const databases = await infrastructureService.getDatabases();
      databases.forEach(db => {
        entities.push({
          id: `db-${db.type}`,
          type: "infrastructure",
          name: `${db.type.toUpperCase()} Store`,
          description: `Workstation database instance for active service memory.`,
          tags: ["database", db.health],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          metadata: {
            version: db.version,
            location: db.location,
            sizeBytes: db.sizeBytes
          }
        });
      });

      const containers = await infrastructureService.getContainers();
      containers.forEach(c => {
        entities.push({
          id: `container-${c.id}`,
          type: "infrastructure",
          name: c.name,
          description: `Docker container runtime instance.`,
          tags: ["docker", c.status],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          metadata: {
            image: c.image,
            volumes: c.volumes,
            networks: c.networks,
            resourceConsumption: c.resourceConsumption
          }
        });
      });
    } catch {}

    this.cache = { entities, timestamp: now };
    return this.filterEntities(entities, options);
  }

  public async getEntity(id: string): Promise<KnowledgeEntity | null> {
    const list = await this.getEntities();
    return list.find(e => e.id === id) || null;
  }

  private filterEntities(list: KnowledgeEntity[], options?: { type?: string; search?: string }): KnowledgeEntity[] {
    let filtered = list;
    if (options?.type) {
      filtered = filtered.filter(e => e.type === options.type);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(
        e =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return filtered;
  }

  // --- 2. Relationship Engine (Step 4) ---
  public async getRelationships(): Promise<Relationship[]> {
    const entities = await this.getEntities();
    const relations: Relationship[] = [];

    // Deduce relations based on entity boundaries
    entities.forEach(ent => {
      // Artifact relations
      if (ent.type === "artifact") {
        if (ent.metadata?.conversationId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.conversationId,
            type: "generated_by"
          });
        }
        if (ent.metadata?.workflowId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.workflowId,
            type: "generated_by"
          });
        }
        // Deduce lineage versioning
        if (ent.name.includes("_v2") || ent.name.includes("updated")) {
          const baseName = ent.name.replace("_v2", "").replace("_updated", "");
          const parent = entities.find(e => e.type === "artifact" && e.id !== ent.id && e.name.startsWith(baseName));
          if (parent) {
            relations.push({
              sourceId: ent.id,
              targetId: parent.id,
              type: "derived_from"
            });
            relations.push({
              sourceId: ent.id,
              targetId: parent.id,
              type: "supersedes"
            });
          }
        }
      }

      // Conversation relations
      if (ent.type === "conversation") {
        if (ent.metadata?.agentId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.agentId,
            type: "belongs_to"
          });
          relations.push({
            sourceId: ent.metadata.agentId,
            targetId: ent.id,
            type: "uses"
          });
        }
      }

      // Execution relations
      if (ent.type === "execution") {
        if (ent.metadata?.conversationId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.conversationId,
            type: "belongs_to"
          });
        }
        if (ent.metadata?.workflowId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.workflowId,
            type: "triggered_by"
          });
        }
        if (ent.metadata?.agentId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.agentId,
            type: "executed_by"
          });
        }
        if (ent.metadata?.toolsUsed) {
          const tools = ent.metadata.toolsUsed as string[];
          tools.forEach(tName => {
            const toolEnt = entities.find(e => e.type === "tool" && e.name === tName);
            if (toolEnt) {
              relations.push({
                sourceId: ent.id,
                targetId: toolEnt.id,
                type: "uses"
              });
            }
          });
        }
      }

      // Agent relations
      if (ent.type === "agent") {
        if (ent.metadata?.tools) {
          const tools = ent.metadata.tools as string[];
          tools.forEach(tId => {
            relations.push({
              sourceId: ent.id,
              targetId: tId,
              type: "uses"
            });
          });
        }
        if (ent.metadata?.allowedModels) {
          const models = ent.metadata.allowedModels as string[];
          models.forEach(mName => {
            const modelEnt = entities.find(e => e.type === "model" && e.name === mName);
            if (modelEnt) {
              relations.push({
                sourceId: ent.id,
                targetId: modelEnt.id,
                type: "uses"
              });
            }
          });
        }
      }

      // Model relations
      if (ent.type === "model") {
        if (ent.metadata?.providerId) {
          relations.push({
            sourceId: ent.id,
            targetId: ent.metadata.providerId,
            type: "belongs_to"
          });
        }
      }

      // Infrastructure relations
      if (ent.type === "infrastructure") {
        if (ent.id.startsWith("db-") || ent.id.startsWith("container-")) {
          relations.push({
            sourceId: ent.id,
            targetId: "host-node",
            type: "belongs_to"
          });
        }
      }

      // Event relations
      if (ent.type === "event") {
        if (ent.metadata?.correlationId) {
          const linkedExec = entities.find(e => e.type === "execution" && e.id === ent.metadata.correlationId);
          if (linkedExec) {
            relations.push({
              sourceId: ent.id,
              targetId: linkedExec.id,
              type: "related_to"
            });
          }
        }
      }
    });

    return relations;
  }

  // --- 3. Lineage Engine (Step 5) ---
  public async getLineage(entityId: string): Promise<Lineage> {
    const relations = await this.getRelationships();
    const path: string[] = [entityId];
    const relationships: Relationship[] = [];

    let currentId = entityId;
    let depth = 0;
    const maxDepth = 10;

    // Follow generated_by, derived_from, belongs_to, triggered_by backwards to origin
    while (depth < maxDepth) {
      const edge = relations.find(
        r =>
          r.sourceId === currentId &&
          (r.type === "generated_by" || r.type === "derived_from" || r.type === "belongs_to" || r.type === "triggered_by")
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

  // --- 4. Knowledge Collections (Step 12) ---
  public async getCollections(): Promise<KnowledgeCollection[]> {
    const entities = await this.getEntities();

    // Map virtual collections without file movement
    const collections: KnowledgeCollection[] = [
      {
        id: "col-project",
        name: "Project Workspaces",
        description: "Source code files and repository components.",
        type: "project",
        entityIds: entities.filter(e => e.type === "file").map(e => e.id)
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
        name: "System Documentation",
        description: "Static guides, playbooks, and guidelines docs.",
        type: "documentation",
        entityIds: entities.filter(e => e.type === "documentation").map(e => e.id)
      },
      {
        id: "col-operations",
        name: "Operations Audit",
        description: "Historical events and operational log outputs.",
        type: "operations",
        entityIds: entities.filter(e => e.type === "event" || e.id.startsWith("log-")).map(e => e.id)
      },
      {
        id: "col-infrastructure",
        name: "Workstation Resources",
        description: "Physical hardware, containers, and database nodes.",
        type: "infrastructure",
        entityIds: entities.filter(e => e.type === "infrastructure").map(e => e.id)
      }
    ];

    return collections;
  }

  // --- 5. Topics (Step 2) ---
  public async getTopics(): Promise<Topic[]> {
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

  // --- 6. Event Timeline (Step 10) ---
  public async getTimeline(): Promise<any[]> {
    const entities = await this.getEntities();

    // Sort all entities chronologically by creation timestamp
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

  // --- 7. Topology Graph compilation (Step 8) ---
  public async getGraph(): Promise<KnowledgeGraph> {
    const entities = await this.getEntities();
    const relations = await this.getRelationships();

    const nodes: KnowledgeNode[] = entities.map(ent => ({
      id: ent.id,
      label: ent.name,
      type: ent.type,
      status: ent.metadata?.status || "healthy"
    }));

    const edges: KnowledgeEdge[] = relations.map(r => ({
      source: r.sourceId,
      target: r.targetId,
      label: r.type,
      type: r.type.replace("_", "-")
    }));

    return { nodes, edges };
  }

  // --- 8. Reference network lookup (Step 11) ---
  public async getReferences(entityId: string): Promise<{ incoming: Reference[]; outgoing: Reference[] }> {
    const relations = await this.getRelationships();

    const incoming = relations
      .filter(r => r.targetId === entityId)
      .map(r => ({ sourceId: r.sourceId, targetId: r.targetId, type: r.type }));

    const outgoing = relations
      .filter(r => r.sourceId === entityId)
      .map(r => ({ sourceId: r.sourceId, targetId: r.targetId, type: r.type }));

    return { incoming, outgoing };
  }

  // --- 9. Global Search Upgrade (Step 9) ---
  public async search(query: string): Promise<any[]> {
    const list = await this.getEntities({ search: query });
    const relations = await this.getRelationships();

    return list.map(ent => {
      // Find connections count
      const connCount = relations.filter(r => r.sourceId === ent.id || r.targetId === ent.id).length;

      // Score relevance
      const score = {
        semanticScore: 0.85,
        recencyScore: 1.0,
        frequencyScore: connCount > 2 ? 0.9 : 0.6,
        totalScore: 0.85 * 0.5 + 1.0 * 0.3 + (connCount > 2 ? 0.9 : 0.6) * 0.2
      };

      return {
        ...ent,
        score,
        connectionsCount: connCount
      };
    }).sort((a, b) => b.score.totalScore - a.score.totalScore);
  }
}

export const knowledgeService = KnowledgeService.getInstance();
export default knowledgeService;
