// ============================================================================
// AI Runtime Service — Aggregation Layer
// ============================================================================
// Combines both Ollama and LiteLLM AI Runtime Providers into a unified view.
// All responses are canonical DTOs. No native provider models leak.
// Implements caching, pagination, filtering, sorting, and search.
// ============================================================================

import { ProviderRegistry } from "@/infrastructure/providers/registry";
import { IAIRuntimeProviderAdapter } from "@/infrastructure/contracts/ai-runtime-provider";
import type {
  AIProvider, AIModel, ModelAlias, Endpoint, RoutingPolicy,
  ProviderHealth, ProviderCapabilities, RuntimeHealth, InferenceStatistics,
  AIRuntimeSummary, AIModelFilters, PaginatedResponse,
  RelationshipGraphData, GraphNode, GraphEdge,
  Capability, CapabilityName, ModelHealth,
} from "@/types/ai-runtime";

// ---------------------------------------------------------------------------
// Cache Layer
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

class SimpleCache {
  private entries: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttlMs) {
      this.entries.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.entries.set(key, { data, timestamp: Date.now(), ttlMs });
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class AIRuntimeService {
  private static instance: AIRuntimeService | null = null;
  private cache = new SimpleCache();
  private providerIds = ["ollama-ai-runtime", "litellm-ai-runtime"];

  private constructor() {}

  public static getInstance(): AIRuntimeService {
    if (!AIRuntimeService.instance) {
      AIRuntimeService.instance = new AIRuntimeService();
    }
    return AIRuntimeService.instance;
  }

  // ---------------------------------------------------------------------------
  // Provider Access
  // ---------------------------------------------------------------------------

  private getAdapters(): IAIRuntimeProviderAdapter[] {
    const registry = ProviderRegistry.getInstance();
    const adapters: IAIRuntimeProviderAdapter[] = [];
    for (const id of this.providerIds) {
      const provider = registry.getProvider<IAIRuntimeProviderAdapter>(id);
      if (provider) adapters.push(provider);
    }
    return adapters;
  }

  private getAdapter(id: string): IAIRuntimeProviderAdapter | null {
    const registry = ProviderRegistry.getInstance();
    return registry.getProvider<IAIRuntimeProviderAdapter>(id);
  }

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------

  async getProviders(): Promise<AIProvider[]> {
    const cached = this.cache.get<AIProvider[]>("providers");
    if (cached) return cached;

    const adapters = this.getAdapters();
    const providers: AIProvider[] = [];

    for (const adapter of adapters) {
      try {
        const health = await adapter.getProviderHealth();
        const caps = await adapter.getProviderCapabilities();
        const endpoints = await adapter.discoverEndpoints();
        const models = await adapter.discoverModels();
        const aliases = await adapter.discoverAliases();
        const version = await adapter.getRuntimeVersion();

        providers.push({
          id: adapter.id,
          name: adapter.name,
          type: adapter.id.includes("litellm") ? "gateway" : "inference",
          description: adapter.id.includes("litellm")
            ? "LiteLLM API Gateway — routes and load-balances AI model requests"
            : "Ollama Local Inference Engine — hosts and serves local model weights",
          version,
          endpoints,
          health,
          capabilities: caps,
          modelCount: models.length,
          aliasCount: aliases.length,
          metadata: {},
        });
      } catch (err) {
        providers.push({
          id: adapter.id,
          name: adapter.name,
          type: adapter.id.includes("litellm") ? "gateway" : "inference",
          description: "Provider unreachable",
          version: "unknown",
          endpoints: [],
          health: {
            providerId: adapter.id, providerName: adapter.name,
            status: "unreachable", latencyMs: 0,
            lastCheckedAt: new Date().toISOString(),
            version: "unknown", errorMessage: String(err),
            heartbeat: false, checks: [],
          },
          capabilities: {
            providerId: adapter.id, providerName: adapter.name,
            supportedCapabilities: [], supportedOperations: [],
            limitations: ["Provider unreachable"], dependencies: [],
            authRequirement: "none",
          },
          modelCount: 0,
          aliasCount: 0,
          metadata: { error: String(err) },
        });
      }
    }

    this.cache.set("providers", providers, 15000);
    return providers;
  }

  async getProvider(id: string): Promise<AIProvider | null> {
    const providers = await this.getProviders();
    return providers.find(p => p.id === id) || null;
  }

  // ---------------------------------------------------------------------------
  // Models
  // ---------------------------------------------------------------------------

  async getAllModels(): Promise<AIModel[]> {
    const cached = this.cache.get<AIModel[]>("all-models");
    if (cached) return cached;

    const adapters = this.getAdapters();
    const allModels: AIModel[] = [];

    for (const adapter of adapters) {
      try {
        const models = await adapter.discoverModels();
        // Merge aliases into models
        const aliases = await adapter.discoverAliases();
        for (const model of models) {
          const modelAliases = aliases
            .filter(a => a.modelId === model.id || a.modelName === model.name)
            .map(a => a.alias);
          model.aliases = [...new Set([...model.aliases, ...modelAliases])];
        }
        allModels.push(...models);
      } catch {}
    }

    this.cache.set("all-models", allModels, 30000);
    return allModels;
  }

  async getModels(filters?: AIModelFilters): Promise<PaginatedResponse<AIModel>> {
    let models = await this.getAllModels();

    // Apply filters
    if (filters?.provider) {
      models = models.filter(m => m.providerId === filters.provider);
    }
    if (filters?.capability) {
      models = models.filter(m => m.capabilities.some(c => c.name === filters.capability && c.supported));
    }
    if (filters?.family) {
      models = models.filter(m => m.family.toLowerCase() === filters.family!.toLowerCase());
    }
    if (filters?.status) {
      models = models.filter(m => m.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q) ||
        m.family.toLowerCase().includes(q) ||
        m.aliases.some(a => a.toLowerCase().includes(q)) ||
        m.providerName.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortBy = filters?.sortBy || "name";
    const sortOrder = filters?.sortOrder || "asc";
    const mult = sortOrder === "asc" ? 1 : -1;
    models.sort((a, b) => {
      switch (sortBy) {
        case "size": return mult * (a.sizeBytes - b.sizeBytes);
        case "parameters": return mult * ((a.parameterCount || 0) - (b.parameterCount || 0));
        case "provider": return mult * a.providerName.localeCompare(b.providerName);
        case "status": return mult * a.status.localeCompare(b.status);
        default: return mult * a.name.localeCompare(b.name);
      }
    });

    // Paginate
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const total = models.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = models.slice(start, start + pageSize);

    return { data, total, page, pageSize, totalPages };
  }

  async getModel(id: string): Promise<AIModel | null> {
    const models = await this.getAllModels();
    return models.find(m => m.id === id) || null;
  }

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  async getRoutes(): Promise<RoutingPolicy[]> {
    const cached = this.cache.get<RoutingPolicy[]>("routes");
    if (cached) return cached;

    const routes: RoutingPolicy[] = [];
    for (const adapter of this.getAdapters()) {
      try {
        routes.push(...(await adapter.discoverRoutes()));
      } catch {}
    }
    this.cache.set("routes", routes, 30000);
    return routes;
  }

  // ---------------------------------------------------------------------------
  // Aliases
  // ---------------------------------------------------------------------------

  async getAliases(): Promise<ModelAlias[]> {
    const cached = this.cache.get<ModelAlias[]>("aliases");
    if (cached) return cached;

    const aliases: ModelAlias[] = [];
    for (const adapter of this.getAdapters()) {
      try {
        aliases.push(...(await adapter.discoverAliases()));
      } catch {}
    }
    this.cache.set("aliases", aliases, 30000);
    return aliases;
  }

  // ---------------------------------------------------------------------------
  // Capabilities
  // ---------------------------------------------------------------------------

  async getCapabilityMatrix(): Promise<{ capabilities: CapabilityName[]; models: { modelId: string; modelName: string; providerId: string; capabilities: Record<string, boolean> }[] }> {
    const models = await this.getAllModels();
    const allCaps = new Set<CapabilityName>();
    for (const m of models) {
      for (const c of m.capabilities) {
        if (c.supported) allCaps.add(c.name);
      }
    }
    const capabilities = Array.from(allCaps).sort();

    const matrix = models.map(m => {
      const capMap: Record<string, boolean> = {};
      for (const cap of capabilities) {
        capMap[cap] = m.capabilities.some(c => c.name === cap && c.supported);
      }
      return {
        modelId: m.id,
        modelName: m.name,
        providerId: m.providerId,
        capabilities: capMap,
      };
    });

    return { capabilities, models: matrix };
  }

  // ---------------------------------------------------------------------------
  // Endpoints
  // ---------------------------------------------------------------------------

  async getEndpoints(): Promise<Endpoint[]> {
    const cached = this.cache.get<Endpoint[]>("endpoints");
    if (cached) return cached;

    const endpoints: Endpoint[] = [];
    for (const adapter of this.getAdapters()) {
      try {
        endpoints.push(...(await adapter.discoverEndpoints()));
      } catch {}
    }
    this.cache.set("endpoints", endpoints, 15000);
    return endpoints;
  }

  // ---------------------------------------------------------------------------
  // Runtime Summary
  // ---------------------------------------------------------------------------

  async getRuntimeSummary(): Promise<AIRuntimeSummary> {
    const [providers, models, aliases, endpoints, routes, health] = await Promise.all([
      this.getProviders(),
      this.getAllModels(),
      this.getAliases(),
      this.getEndpoints(),
      this.getRoutes(),
      this.getRuntimeHealth(),
    ]);

    return {
      providers,
      totalModels: models.length,
      totalAliases: aliases.length,
      totalEndpoints: endpoints.length,
      totalRoutes: routes.length,
      health,
      discoveredAt: new Date().toISOString(),
    };
  }

  // ---------------------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------------------

  async getRuntimeHealth(): Promise<RuntimeHealth> {
    const adapters = this.getAdapters();
    const providerHealths: ProviderHealth[] = [];
    const modelHealths: ModelHealth[] = [];

    for (const adapter of adapters) {
      try {
        const ph = await adapter.getProviderHealth();
        providerHealths.push(ph);

        const models = await adapter.discoverModels();
        for (const m of models) {
          modelHealths.push({
            modelId: m.id,
            modelName: m.name,
            providerId: adapter.id,
            status: m.status === "running" ? "healthy" : m.status === "available" ? "healthy" : "unknown",
            loaded: m.status === "running",
            lastAccessedAt: m.lifecycle.lastAccessedAt,
          });
        }
      } catch {
        providerHealths.push({
          providerId: adapter.id, providerName: adapter.name,
          status: "unreachable", latencyMs: 0,
          lastCheckedAt: new Date().toISOString(),
          version: "unknown", errorMessage: "Provider unreachable",
          heartbeat: false, checks: [],
        });
      }
    }

    const allHealthy = providerHealths.every(p => p.status === "healthy");
    const anyHealthy = providerHealths.some(p => p.status === "healthy");

    return {
      overallStatus: allHealthy ? "healthy" : anyHealthy ? "degraded" : "unhealthy",
      providers: providerHealths,
      models: modelHealths,
      lastCheckedAt: new Date().toISOString(),
      uptimeSeconds: 0,
    };
  }

  // ---------------------------------------------------------------------------
  // Version
  // ---------------------------------------------------------------------------

  async getRuntimeVersions(): Promise<{ providerId: string; providerName: string; version: string }[]> {
    const versions: { providerId: string; providerName: string; version: string }[] = [];
    for (const adapter of this.getAdapters()) {
      try {
        const version = await adapter.getRuntimeVersion();
        versions.push({ providerId: adapter.id, providerName: adapter.name, version });
      } catch {
        versions.push({ providerId: adapter.id, providerName: adapter.name, version: "unknown" });
      }
    }
    return versions;
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  async getStatistics(): Promise<InferenceStatistics[]> {
    const stats: InferenceStatistics[] = [];
    for (const adapter of this.getAdapters()) {
      try {
        stats.push(await adapter.getInferenceStatistics());
      } catch {}
    }
    return stats;
  }

  // ---------------------------------------------------------------------------
  // Relationship Graph
  // ---------------------------------------------------------------------------

  async buildRelationshipGraph(): Promise<RelationshipGraphData> {
    const [providers, models, aliases, routes] = await Promise.all([
      this.getProviders(),
      this.getAllModels(),
      this.getAliases(),
      this.getRoutes(),
    ]);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const seen = new Set<string>();

    // Add provider nodes
    for (const p of providers) {
      const nodeId = `provider:${p.id}`;
      if (!seen.has(nodeId)) {
        seen.add(nodeId);
        nodes.push({ id: nodeId, label: p.name, type: p.type === "gateway" ? "gateway" : "provider", status: p.health.status });
      }
    }

    // Gateway → Provider edges
    const gateway = providers.find(p => p.type === "gateway");
    const inferenceProviders = providers.filter(p => p.type === "inference");
    if (gateway) {
      for (const ip of inferenceProviders) {
        edges.push({ source: `provider:${gateway.id}`, target: `provider:${ip.id}`, label: "routes to", type: "routes-to" });
      }
    }

    // Add model nodes and provider→model edges
    for (const m of models) {
      const modelNodeId = `model:${m.id}`;
      if (!seen.has(modelNodeId)) {
        seen.add(modelNodeId);
        nodes.push({
          id: modelNodeId,
          label: m.displayName,
          type: "model",
          status: m.status === "running" ? "healthy" : m.status === "available" ? "healthy" : "unknown",
        });
        edges.push({ source: `provider:${m.providerId}`, target: modelNodeId, label: "provides", type: "provides" });

        // Add capability nodes for each model
        for (const cap of m.capabilities.filter(c => c.supported)) {
          const capNodeId = `capability:${cap.name}`;
          if (!seen.has(capNodeId)) {
            seen.add(capNodeId);
            nodes.push({ id: capNodeId, label: cap.name, type: "capability", status: "healthy" });
          }
          edges.push({ source: modelNodeId, target: capNodeId, type: "has-capability" });
        }
      }
    }

    // Add alias nodes
    for (const a of aliases) {
      const aliasNodeId = `alias:${a.alias}`;
      if (!seen.has(aliasNodeId)) {
        seen.add(aliasNodeId);
        nodes.push({ id: aliasNodeId, label: a.alias, type: "alias", status: "healthy" });
      }
      edges.push({ source: aliasNodeId, target: `model:${a.modelId}`, label: "maps to", type: "aliases" });
      if (gateway) {
        edges.push({ source: `provider:${gateway.id}`, target: aliasNodeId, type: "aliases" });
      }
    }

    return { nodes, edges };
  }

  // ---------------------------------------------------------------------------
  // Cache Management
  // ---------------------------------------------------------------------------

  invalidateCache(): void {
    this.cache.clear();
  }
}

export const aiRuntimeService = AIRuntimeService.getInstance();
export default aiRuntimeService;
