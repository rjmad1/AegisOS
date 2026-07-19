// src/platform/control-plane/digital-twin/simulation/SimulationSession.ts
import { GraphKernel } from '../core/GraphKernel';

export interface SimulationSessionData {
  id: string;
  parentSessionId?: string;
  snapshotVersion: string;
  executionEngine: 'OVERLAY' | 'BRANCH' | 'SANDBOX';
  projectionScope: string[];
  deltaPayload: any;
  policiesChecked: string[];
  reasoningTrace?: string;
  evidenceHash?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: number;
  completedAt?: number;
}

export class SimulationSession {
  public readonly data: SimulationSessionData;
  public readonly graph: GraphKernel;

  constructor(data: SimulationSessionData, baseGraph: GraphKernel) {
    this.data = data;
    // Both Overlay and Branch clone the graph.
    // Overlay is treated as a transient clone, while Branch is an evolving transactional model.
    this.graph = baseGraph.clone();
  }

  /**
   * Apply simulated delta mutations to this session's graph
   */
  public applyDelta(delta: {
    addNodes?: any[];
    removeNodes?: string[];
    updateNodes?: { id: string; updates: any }[];
    addEdges?: any[];
    removeEdges?: { source: string; target: string; relationship: string }[];
  }): void {
    if (delta.addNodes) {
      for (const n of delta.addNodes) {
        this.graph.addNode(n);
        this.data.deltaPayload.addNodes = this.data.deltaPayload.addNodes || [];
        this.data.deltaPayload.addNodes.push(n);
      }
    }
    if (delta.updateNodes) {
      for (const item of delta.updateNodes) {
        this.graph.updateNode(item.id, item.updates);
        this.data.deltaPayload.updateNodes = this.data.deltaPayload.updateNodes || [];
        this.data.deltaPayload.updateNodes.push(item);
      }
    }
    if (delta.removeNodes) {
      for (const id of delta.removeNodes) {
        this.graph.removeNode(id);
        this.data.deltaPayload.removeNodes = this.data.deltaPayload.removeNodes || [];
        this.data.deltaPayload.removeNodes.push(id);
      }
    }
    if (delta.addEdges) {
      for (const e of delta.addEdges) {
        this.graph.addEdge(e);
        this.data.deltaPayload.addEdges = this.data.deltaPayload.addEdges || [];
        this.data.deltaPayload.addEdges.push(e);
      }
    }
    if (delta.removeEdges) {
      for (const edgeKey of delta.removeEdges) {
        this.graph.removeEdge(edgeKey.source, edgeKey.target, edgeKey.relationship);
        this.data.deltaPayload.removeEdges = this.data.deltaPayload.removeEdges || [];
        this.data.deltaPayload.removeEdges.push(edgeKey);
      }
    }
  }

  public complete(status: 'COMPLETED' | 'FAILED', reasoningTrace?: string, evidenceHash?: string): void {
    this.data.status = status;
    this.data.completedAt = Date.now();
    this.data.reasoningTrace = reasoningTrace;
    this.data.evidenceHash = evidenceHash;
  }
}
