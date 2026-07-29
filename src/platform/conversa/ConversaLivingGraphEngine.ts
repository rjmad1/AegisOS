import { conversaRepository } from './conversa-repository';

export type NodeType = 'Task' | 'Decision' | 'Risk' | 'Meeting' | 'Document';
export type EdgeRelationship = 'DependsOn' | 'ExtractedFrom' | 'References';

export interface GraphNodeInput {
  meetingId?: string;
  label: string;
  type: NodeType;
  properties?: Record<string, any>;
}

export interface GraphEdgeInput {
  sourceNodeId: string;
  targetNodeId: string;
  relationship: EdgeRelationship;
  properties?: Record<string, any>;
}

export class ConversaLivingGraphEngine {
  private static instance: ConversaLivingGraphEngine | null = null;

  public static getInstance(): ConversaLivingGraphEngine {
    if (!ConversaLivingGraphEngine.instance) {
      ConversaLivingGraphEngine.instance = new ConversaLivingGraphEngine();
    }
    return ConversaLivingGraphEngine.instance;
  }

  /**
   * Adds a new node to the Living Workspace Knowledge Graph.
   */
  public async addNode(input: GraphNodeInput) {
    console.log(`[ConversaLivingGraphEngine] Creating node: "${input.label}" (${input.type})`);
    return conversaRepository.createGraphNode(
      input.meetingId || null,
      input.label,
      input.type,
      input.properties || {}
    );
  }

  /**
   * Connects two nodes with a typed relationship edge, enforcing cycle prevention for 'DependsOn'.
   */
  public async addEdge(input: GraphEdgeInput) {
    if (input.sourceNodeId === input.targetNodeId) {
      throw new Error(`Self-referential edges are prohibited: ${input.sourceNodeId}`);
    }

    if (input.relationship === 'DependsOn') {
      const wouldCauseCycle = await this.detectCycle(input.sourceNodeId, input.targetNodeId);
      if (wouldCauseCycle) {
        throw new Error(`Cycle detected! Edge ${input.sourceNodeId} -> ${input.targetNodeId} violates graph DAG constraint.`);
      }
    }

    console.log(`[ConversaLivingGraphEngine] Adding edge: ${input.sourceNodeId} --[${input.relationship}]--> ${input.targetNodeId}`);
    return conversaRepository.createGraphEdge(
      input.sourceNodeId,
      input.targetNodeId,
      input.relationship,
      input.properties
    );
  }

  /**
   * Performs DFS cycle detection for dependency edges.
   */
  private async detectCycle(startNodeId: string, targetNodeId: string): Promise<boolean> {
    const topology = await conversaRepository.getGraphTopology();
    const visited = new Set<string>();
    const queue = [targetNodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === startNodeId) {
        return true; // Cycle found
      }
      visited.add(current);

      const outgoing = topology.edges.filter(
        (e: { sourceNodeId: string; relationship: string; targetNodeId: string }) =>
          e.sourceNodeId === current && e.relationship === 'DependsOn'
      );

      for (const edge of outgoing) {
        if (!visited.has(edge.targetNodeId)) {
          queue.push(edge.targetNodeId);
        }
      }
    }

    return false;
  }

  /**
   * Fetches the complete workspace graph representation.
   */
  public async getWorkspaceGraph() {
    return conversaRepository.getGraphTopology();
  }
}

export const conversaLivingGraphEngine = ConversaLivingGraphEngine.getInstance();
