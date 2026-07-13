import { KnowledgeAsset, KnowledgeGraphNode, KnowledgeGraphEdge } from "./types";

export class KnowledgeRuntime {
  private static instance: KnowledgeRuntime | null = null;
  private assets: Map<string, KnowledgeAsset> = new Map();
  private graphNodes: Map<string, KnowledgeGraphNode> = new Map();
  private graphEdges: KnowledgeGraphEdge[] = [];

  private constructor() {
    this.seedDefaultKnowledge();
  }

  public static getInstance(): KnowledgeRuntime {
    if (!KnowledgeRuntime.instance) {
      KnowledgeRuntime.instance = new KnowledgeRuntime();
    }
    return KnowledgeRuntime.instance;
  }

  private seedDefaultKnowledge(): void {
    const assets: KnowledgeAsset[] = [
      {
        id: "know:adr:001",
        title: "ADR-001: Platform Kernel Architecture",
        content: "Platform Kernel initializes modules in phases: created, bootstrapping, initializing, resolving, ready, running. Circular dependencies in ServiceRegistry are forbidden.",
        sourceUri: "file:///docs/adr/001_kernel.md",
        lineage: ["ingest:docs/adr/001", "clean:md-to-text"],
        freshnessScore: 1.0,
        provenance: "Architecture Review Board",
        tags: ["adr", "kernel", "platform"],
        updatedAt: new Date().toISOString(),
      },
      {
        id: "know:api:v1",
        title: "API Gateway Routes V1",
        content: "All REST APIs are served under /api/v1/. Secure endpoints verify JWT signatures, rate limit IPs (150 calls/min), and apply RBAC policies.",
        sourceUri: "file:///docs/api/v1_spec.json",
        lineage: ["ingest:api/v1_spec.json", "transform:json-parse"],
        freshnessScore: 0.95,
        provenance: "Platform DevOps team",
        tags: ["api", "security", "gateway"],
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const a of assets) {
      this.registerAsset(a);
    }

    // Seed relationship graph
    this.addGraphNode({ id: "kernel", label: "Kernel Platform", type: "system" });
    this.addGraphNode({ id: "sec", label: "Security Guardrails", type: "system" });
    this.addGraphNode({ id: "api", label: "API Gateway", type: "interface" });
    
    this.addGraphEdge({ source: "kernel", target: "api", relationship: "exposes", weight: 0.9 });
    this.addGraphEdge({ source: "api", target: "sec", relationship: "secured_by", weight: 1.0 });
  }

  public registerAsset(asset: KnowledgeAsset): void {
    this.assets.set(asset.id, asset);
  }

  public addGraphNode(node: KnowledgeGraphNode): void {
    this.graphNodes.set(node.id, node);
  }

  public addGraphEdge(edge: KnowledgeGraphEdge): void {
    this.graphEdges.push(edge);
  }

  public getAsset(id: string): KnowledgeAsset | undefined {
    return this.assets.get(id);
  }

  public getGraphData(): { nodes: KnowledgeGraphNode[]; edges: KnowledgeGraphEdge[] } {
    return {
      nodes: Array.from(this.graphNodes.values()),
      edges: this.graphEdges,
    };
  }

  /**
   * Hybrid Search: Combines keyword search matching, mock semantic similarity,
   * and Graph connection boosts.
   */
  public async queryHybrid(query: string, options?: { minScore?: number }): Promise<KnowledgeAsset[]> {
    const q = query.toLowerCase();
    const minScore = options?.minScore ?? 0.1;

    const scored = Array.from(this.assets.values()).map((asset) => {
      let score = 0.0;

      // 1. Keyword search relevance
      if (asset.title.toLowerCase().includes(q)) score += 0.5;
      if (asset.content.toLowerCase().includes(q)) score += 0.3;
      
      // Tag matching
      const matchingTags = asset.tags.filter((t) => q.includes(t.toLowerCase()));
      score += matchingTags.length * 0.2;

      // 2. Mock Semantic similarity (similarity matches tags/query context)
      if (q.includes("platform") && asset.tags.includes("platform")) score += 0.4;
      if (q.includes("security") && asset.tags.includes("security")) score += 0.4;

      // 3. Graph connectivity boost: if query matches graph node and node connects to asset
      // We look up associated graph nodes and add connectedness weight
      for (const edge of this.graphEdges) {
        if (edge.relationship === "secured_by" && q.includes("security") && asset.tags.includes("gateway")) {
          score += 0.3; // Secure route boost
        }
      }

      // Multiply by freshness score to penalize stale assets
      score *= asset.freshnessScore;

      return { asset, score };
    });

    // Filter and sort
    const filtered = scored.filter((s) => s.score >= minScore);
    filtered.sort((a, b) => b.score - a.score);

    return filtered.map((f) => f.asset);
  }

  public getLineage(assetId: string): string[] {
    const asset = this.getAsset(assetId);
    return asset ? asset.lineage : [];
  }

  /**
   * Calculates and updates the freshness score of an asset based on how long ago it was modified.
   */
  public validateFreshness(assetId: string): number {
    const asset = this.getAsset(assetId);
    if (!asset) return 0.0;

    const elapsedDays = (Date.now() - new Date(asset.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    
    // Freshness decay: 1.0 down to 0.1 over 30 days
    const score = Math.max(0.1, 1.0 - elapsedDays / 30);
    asset.freshnessScore = score;
    return score;
  }
}
export default KnowledgeRuntime;
