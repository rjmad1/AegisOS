import { NavigationNode, NavigationEdge, ActionCommand } from '@platform/shared-contracts';

export interface IStateStore {
  addNode(node: NavigationNode): Promise<void>;
  getNode(nodeId: string): Promise<NavigationNode | null>;
  hasNode(domHash: string): Promise<boolean>;
  getNodeByHash(domHash: string): Promise<NavigationNode | null>;
  addEdge(edge: NavigationEdge): Promise<void>;
  getUnvisitedEdges(sessionId: string): Promise<NavigationEdge[]>;
  markEdgeVisited(edgeId: string, toNodeId: string): Promise<void>;
  getGraphCoverage(sessionId: string): Promise<number>;
}

export class InMemoryGraphStore implements IStateStore {
  private nodes: Map<string, NavigationNode> = new Map(); // nodeId -> NavigationNode
  private hashToNodeId: Map<string, string> = new Map(); // domHash -> nodeId
  private edges: Map<string, NavigationEdge> = new Map(); // edgeId -> NavigationEdge
  private sessionEdges: Map<string, Set<string>> = new Map(); // sessionId -> Set of edgeIds

  async addNode(node: NavigationNode): Promise<void> {
    this.nodes.set(node.nodeId, node);
    this.hashToNodeId.set(node.domHash, node.nodeId);
  }

  async getNode(nodeId: string): Promise<NavigationNode | null> {
    return this.nodes.get(nodeId) || null;
  }

  async hasNode(domHash: string): Promise<boolean> {
    return this.hashToNodeId.has(domHash);
  }

  async getNodeByHash(domHash: string): Promise<NavigationNode | null> {
    const nodeId = this.hashToNodeId.get(domHash);
    if (!nodeId) return null;
    return this.nodes.get(nodeId) || null;
  }

  async addEdge(edge: NavigationEdge): Promise<void> {
    this.edges.set(edge.edgeId, edge);
  }

  async getUnvisitedEdges(sessionId: string): Promise<NavigationEdge[]> {
    const unvisited: NavigationEdge[] = [];
    for (const edge of this.edges.values()) {
      if (!edge.visited && edge.visitCount < 3) {
        unvisited.push(edge);
      }
    }
    return unvisited;
  }

  async markEdgeVisited(edgeId: string, toNodeId: string): Promise<void> {
    const edge = this.edges.get(edgeId);
    if (edge) {
      edge.visited = true;
      edge.visitCount += 1;
      edge.toNodeId = toNodeId;
    }
  }

  async getGraphCoverage(sessionId: string): Promise<number> {
    if (this.edges.size === 0) return 0;
    let visitedCount = 0;
    for (const edge of this.edges.values()) {
      if (edge.visited) visitedCount++;
    }
    return visitedCount / this.edges.size;
  }
}
