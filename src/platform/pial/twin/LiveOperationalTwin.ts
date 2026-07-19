export interface TwinNode {
  id: string;
  type: string;
  properties: Record<string, any>;
  lastUpdated: number;
}

export interface TwinEdge {
  sourceId: string;
  targetId: string;
  relationship: string;
  properties?: Record<string, any>;
}

export class LiveOperationalTwin {
  private nodes = new Map<string, TwinNode>();
  private edges: TwinEdge[] = [];

  public upsertNode(id: string, type: string, properties: Record<string, any>): void {
    this.nodes.set(id, {
      id,
      type,
      properties,
      lastUpdated: Date.now()
    });
  }

  public removeNode(id: string): void {
    this.nodes.delete(id);
    this.edges = this.edges.filter(e => e.sourceId !== id && e.targetId !== id);
  }

  public addEdge(sourceId: string, targetId: string, relationship: string, properties?: Record<string, any>): void {
    this.edges.push({ sourceId, targetId, relationship, properties });
  }

  public getSnapshot() {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: [...this.edges]
    };
  }

  public queryNodesByType(type: string): TwinNode[] {
    return Array.from(this.nodes.values()).filter(n => n.type === type);
  }
}
