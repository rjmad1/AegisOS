// src/platform/control-plane/digital-twin/core/GraphAccessLayer.ts
import { GraphKernel } from './GraphKernel';
import { DigitalTwinNode } from './node';
import { DigitalTwinEdge } from './edge';

export interface DSLQuery {
  match?: {
    nodeType?: string;
    id?: string;
    labels?: string[];
  };
  where?: {
    health?: string;
    state?: string;
    properties?: Record<string, any>;
  };
  traverse?: {
    relationship?: string;
    direction?: 'out' | 'in' | 'both';
    depth?: number;
  };
  return?: 'nodes' | 'edges' | 'count';
}

export class GraphAccessLayer {
  private static instance: GraphAccessLayer | null = null;

  private constructor() {}

  public static getInstance(): GraphAccessLayer {
    if (!GraphAccessLayer.instance) {
      GraphAccessLayer.instance = new GraphAccessLayer();
    }
    return GraphAccessLayer.instance;
  }

  /**
   * Evaluates a Declarative DSL Query against a GraphKernel instance.
   */
  public evaluateQuery(kernel: GraphKernel, query: DSLQuery): any {
    // 1. Match base nodes
    let candidates = kernel.getAllNodes();

    if (query.match) {
      if (query.match.nodeType) {
        candidates = candidates.filter(n => n.type === query.match?.nodeType);
      }
      if (query.match.id) {
        candidates = candidates.filter(n => n.id === query.match?.id);
      }
      if (query.match.labels && query.match.labels.length > 0) {
        candidates = candidates.filter(n => 
          query.match!.labels!.every(l => n.labels.includes(l))
        );
      }
    }

    // 2. Filter via where clause
    if (query.where) {
      if (query.where.health) {
        candidates = candidates.filter(n => n.health === query.where?.health);
      }
      if (query.where.state) {
        candidates = candidates.filter(n => n.state === query.where?.state);
      }
      if (query.where.properties) {
        for (const [key, val] of Object.entries(query.where.properties)) {
          candidates = candidates.filter(n => n.properties[key] === val);
        }
      }
    }

    // 3. Traverse if requested
    let resultNodes = new Set<DigitalTwinNode>(candidates);
    let resultEdges = new Set<DigitalTwinEdge>();

    if (query.traverse && candidates.length > 0) {
      const depth = query.traverse.depth ?? 1;
      const relationship = query.traverse.relationship;
      const direction = query.traverse.direction ?? 'out';

      let currentLevel = new Set<string>(candidates.map(n => n.id));
      const visited = new Set<string>(currentLevel);

      for (let d = 0; d < depth; d++) {
        const nextLevel = new Set<string>();
        for (const nodeId of currentLevel) {
          let edges: DigitalTwinEdge[] = [];
          if (direction === 'out' || direction === 'both') {
            edges.push(...kernel.getOutgoingEdges(nodeId));
          }
          if (direction === 'in' || direction === 'both') {
            edges.push(...kernel.getIncomingEdges(nodeId));
          }

          // Filter by relationship type if specified
          if (relationship) {
            edges = edges.filter(e => e.relationship === relationship);
          }

          for (const edge of edges) {
            const nextNodeId = direction === 'in' ? edge.source : edge.target;
            if (!visited.has(nextNodeId)) {
              visited.add(nextNodeId);
              nextLevel.add(nextNodeId);
              const node = kernel.getNode(nextNodeId);
              if (node) resultNodes.add(node);
            }
            resultEdges.add(edge);
          }
        }
        if (nextLevel.size === 0) break;
        currentLevel = nextLevel;
      }
    }

    // 4. Return format
    const retType = query.return ?? 'nodes';
    if (retType === 'count') {
      return resultNodes.size;
    } else if (retType === 'edges') {
      return Array.from(resultEdges);
    } else {
      return Array.from(resultNodes);
    }
  }

  // --- Graph Algorithms ---

  /**
   * Retrieves the dependency closure (recursive outgoing links) for a node
   */
  public getDependencyClosure(kernel: GraphKernel, startNodeId: string, relationship = 'depends-on'): string[] {
    const dependencies = new Set<string>();
    
    kernel.dfs(startNodeId, (node) => {
      if (node.id === startNodeId) return; // skip start node itself
      dependencies.add(node.id);
    });

    // If filtering by specific relationship is needed
    if (relationship) {
      const filtered = new Set<string>();
      const queue = [startNodeId];
      const visited = new Set<string>(queue);

      while (queue.length > 0) {
        const current = queue.shift()!;
        const out = kernel.getOutgoingEdges(current).filter(e => e.relationship === relationship);
        for (const e of out) {
          if (!visited.has(e.target)) {
            visited.add(e.target);
            filtered.add(e.target);
            queue.push(e.target);
          }
        }
      }
      return Array.from(filtered);
    }

    return Array.from(dependencies);
  }

  /**
   * Retrieves the impact radius (recursive incoming links) for a node
   */
  public getImpactRadius(kernel: GraphKernel, startNodeId: string, relationship = 'depends-on'): string[] {
    const dependents = new Set<string>();
    const queue = [startNodeId];
    const visited = new Set<string>(queue);

    while (queue.length > 0) {
      const current = queue.shift()!;
      // Find edges pointing TO current (incoming)
      const incoming = kernel.getIncomingEdges(current);
      
      const filteredIncoming = relationship 
        ? incoming.filter(e => e.relationship === relationship)
        : incoming;

      for (const edge of filteredIncoming) {
        if (!visited.has(edge.source)) {
          visited.add(edge.source);
          dependents.add(edge.source);
          queue.push(edge.source);
        }
      }
    }

    return Array.from(dependents);
  }

  /**
   * Cycle Detection using DFS (returns true if a cycle exists)
   */
  public hasCycle(kernel: GraphKernel): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfsDetect = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const outEdges = kernel.getOutgoingEdges(nodeId);
      for (const edge of outEdges) {
        if (dfsDetect(edge.target)) {
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    const nodes = kernel.getAllNodes();
    for (const node of nodes) {
      if (dfsDetect(node.id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Topological sort of graph nodes. Useful for boot orchestration order.
   */
  public topologicalSort(kernel: GraphKernel): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const helper = (nodeId: string) => {
      visited.add(nodeId);
      const outEdges = kernel.getOutgoingEdges(nodeId);
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) {
          helper(edge.target);
        }
      }
      result.unshift(nodeId);
    };

    const nodes = kernel.getAllNodes();
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        helper(node.id);
      }
    }

    return result;
  }
}
export const graphAccessLayer = GraphAccessLayer.getInstance();
export default graphAccessLayer;
