// src/platform/control-plane/digital-twin/core/GraphKernel.ts
import { DigitalTwinNode } from './node';
import { DigitalTwinEdge } from './edge';

export class GraphKernel {
  private nodes: Map<string, DigitalTwinNode> = new Map();
  private outgoing: Map<string, Set<DigitalTwinEdge>> = new Map();
  private incoming: Map<string, Set<DigitalTwinEdge>> = new Map();

  constructor() {}

  /**
   * Clone the graph kernel (Copy-on-Write structural cloning)
   */
  public clone(): GraphKernel {
    const next = new GraphKernel();
    // Copy nodes
    for (const [id, node] of this.nodes.entries()) {
      next.nodes.set(id, { ...node, properties: { ...node.properties }, labels: [...node.labels] });
    }
    // Re-insert edges to rebuild adjacency structures cleanly
    for (const edges of this.outgoing.values()) {
      for (const edge of edges) {
        next.addEdge({ ...edge, properties: { ...edge.properties } });
      }
    }
    return next;
  }

  public clear(): void {
    this.nodes.clear();
    this.outgoing.clear();
    this.incoming.clear();
  }

  // --- Node Mutators ---

  public addNode(node: DigitalTwinNode): void {
    this.nodes.set(node.id, node);
    if (!this.outgoing.has(node.id)) this.outgoing.set(node.id, new Set());
    if (!this.incoming.has(node.id)) this.incoming.set(node.id, new Set());
  }

  public updateNode(id: string, updates: Partial<DigitalTwinNode>): void {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error(`Node not found: ${id}`);
    }
    Object.assign(node, {
      ...updates,
      properties: updates.properties ? { ...node.properties, ...updates.properties } : node.properties,
      labels: updates.labels ? Array.from(new Set([...node.labels, ...updates.labels])) : node.labels,
      timestamp: Date.now()
    });
  }

  public removeNode(id: string): void {
    this.nodes.delete(id);
    
    // Remove all connected edges
    const outEdges = this.outgoing.get(id);
    if (outEdges) {
      for (const edge of outEdges) {
        const inc = this.incoming.get(edge.target);
        if (inc) {
          inc.delete(edge);
        }
      }
      this.outgoing.delete(id);
    }

    const inEdges = this.incoming.get(id);
    if (inEdges) {
      for (const edge of inEdges) {
        const out = this.outgoing.get(edge.source);
        if (out) {
          out.delete(edge);
        }
      }
      this.incoming.delete(id);
    }
  }

  public getNode(id: string): DigitalTwinNode | undefined {
    return this.nodes.get(id);
  }

  public hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  public getAllNodes(): DigitalTwinNode[] {
    return Array.from(this.nodes.values());
  }

  // --- Edge Mutators ---

  public addEdge(edge: DigitalTwinEdge): void {
    // We allow dangling edges, but ensure maps exist
    if (!this.outgoing.has(edge.source)) this.outgoing.set(edge.source, new Set());
    if (!this.incoming.has(edge.target)) this.incoming.set(edge.target, new Set());

    // Check duplicate
    const outSet = this.outgoing.get(edge.source)!;
    for (const existing of outSet) {
      if (existing.target === edge.target && existing.relationship === edge.relationship) {
        outSet.delete(existing);
        this.incoming.get(edge.target)?.delete(existing);
        break;
      }
    }

    this.outgoing.get(edge.source)!.add(edge);
    this.incoming.get(edge.target)!.add(edge);
  }

  public updateEdge(source: string, target: string, relationship: string, updates: Partial<DigitalTwinEdge>): void {
    const edge = this.getEdge(source, target, relationship);
    if (!edge) {
      throw new Error(`Edge not found: ${source} -[${relationship}]-> ${target}`);
    }
    Object.assign(edge, {
      ...updates,
      properties: updates.properties ? { ...edge.properties, ...updates.properties } : edge.properties
    });
  }

  public removeEdge(source: string, target: string, relationship: string): void {
    const outSet = this.outgoing.get(source);
    if (outSet) {
      for (const edge of outSet) {
        if (edge.target === target && edge.relationship === relationship) {
          outSet.delete(edge);
          this.incoming.get(target)?.delete(edge);
          break;
        }
      }
    }
  }

  public getEdge(source: string, target: string, relationship: string): DigitalTwinEdge | undefined {
    const outSet = this.outgoing.get(source);
    if (outSet) {
      for (const edge of outSet) {
        if (edge.target === target && edge.relationship === relationship) {
          return edge;
        }
      }
    }
    return undefined;
  }

  public getAllEdges(): DigitalTwinEdge[] {
    const all: DigitalTwinEdge[] = [];
    for (const edges of this.outgoing.values()) {
      all.push(...edges);
    }
    return all;
  }

  public getOutgoingEdges(nodeId: string): DigitalTwinEdge[] {
    const set = this.outgoing.get(nodeId);
    return set ? Array.from(set) : [];
  }

  public getIncomingEdges(nodeId: string): DigitalTwinEdge[] {
    const set = this.incoming.get(nodeId);
    return set ? Array.from(set) : [];
  }

  // --- Traversals ---

  public dfs(startNodeId: string, visitor: (node: DigitalTwinNode) => boolean | void): void {
    const visited = new Set<string>();
    const stack: string[] = [startNodeId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;

      const node = this.nodes.get(currentId);
      if (!node) continue;

      visited.add(currentId);
      const shouldStop = visitor(node);
      if (shouldStop === true) break;

      const outEdges = this.getOutgoingEdges(currentId);
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) {
          stack.push(edge.target);
        }
      }
    }
  }

  public bfs(startNodeId: string, visitor: (node: DigitalTwinNode) => boolean | void): void {
    const visited = new Set<string>();
    const queue: string[] = [startNodeId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;

      const node = this.nodes.get(currentId);
      if (!node) continue;

      visited.add(currentId);
      const shouldStop = visitor(node);
      if (shouldStop === true) break;

      const outEdges = this.getOutgoingEdges(currentId);
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }
  }
}
export default GraphKernel;
