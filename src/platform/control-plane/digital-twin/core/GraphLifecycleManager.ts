// src/platform/control-plane/digital-twin/core/GraphLifecycleManager.ts
import { createHash } from 'crypto';
import prisma from '../../../../infrastructure/db/prisma';
import { GraphKernel } from './GraphKernel';
import { DigitalTwinNode } from './node';
import { DigitalTwinEdge } from './edge';

export class GraphLifecycleManager {
  private static instance: GraphLifecycleManager | null = null;

  private constructor() {}

  public static getInstance(): GraphLifecycleManager {
    if (!GraphLifecycleManager.instance) {
      GraphLifecycleManager.instance = new GraphLifecycleManager();
    }
    return GraphLifecycleManager.instance;
  }

  /**
   * Computes the SHA-256 hash of the graph structure.
   */
  public computeGraphHash(nodes: DigitalTwinNode[], edges: DigitalTwinEdge[]): string {
    const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const sortedEdges = [...edges].sort((a, b) => {
      const cmpSource = a.source.localeCompare(b.source);
      if (cmpSource !== 0) return cmpSource;
      const cmpTarget = a.target.localeCompare(b.target);
      if (cmpTarget !== 0) return cmpTarget;
      return a.relationship.localeCompare(b.relationship);
    });

    const payload = JSON.stringify({
      nodes: sortedNodes.map(n => ({ id: n.id, type: n.type, health: n.health, state: n.state, labels: n.labels })),
      edges: sortedEdges.map(e => ({ source: e.source, target: e.target, relationship: e.relationship }))
    });

    return createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Logs a mutation to the persistent SQLite ledger
   */
  public async logMutation(params: {
    graphVersionId: string;
    mutationType: 'NODE_ADD' | 'NODE_REMOVE' | 'NODE_UPDATE' | 'EDGE_ADD' | 'EDGE_REMOVE' | 'EDGE_UPDATE';
    nodeId?: string;
    edgeSourceId?: string;
    edgeTargetId?: string;
    payload: any;
    actor: 'system' | 'operator' | 'agent';
    reason?: string;
    correlationId?: string;
  }): Promise<void> {
    try {
      await prisma.digitalTwinMutation.create({
        data: {
          graphVersionId: params.graphVersionId,
          mutationType: params.mutationType,
          nodeId: params.nodeId || null,
          edgeSourceId: params.edgeSourceId || null,
          edgeTargetId: params.edgeTargetId || null,
          payload: JSON.stringify(params.payload),
          actor: params.actor,
          reason: params.reason || null,
          correlationId: params.correlationId || null,
        }
      });
    } catch (err: any) {
      console.error('[GraphLifecycleManager] Failed to log mutation:', err.message);
    }
  }

  /**
   * Saves a full graph snapshot to the SQLite database
   */
  public async saveSnapshot(graphVersionId: string, kernel: GraphKernel): Promise<string> {
    const nodes = kernel.getAllNodes();
    const edges = kernel.getAllEdges();
    const graphHash = this.computeGraphHash(nodes, edges);

    const serializedData = JSON.stringify({ nodes, edges });

    try {
      const snapshot = await prisma.digitalTwinSnapshot.upsert({
        where: { graphVersionId },
        update: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          graphHash,
          serializedData,
          timestamp: new Date()
        },
        create: {
          graphVersionId,
          nodeCount: nodes.length,
          edgeCount: edges.length,
          graphHash,
          serializedData,
          timestamp: new Date()
        }
      });
      return snapshot.id;
    } catch (err: any) {
      console.error('[GraphLifecycleManager] Failed to save snapshot:', err.message);
      throw err;
    }
  }

  /**
   * Creates a new version record
   */
  public async createVersion(params: {
    id: string;
    parentVersionId: string | null;
    kernel: GraphKernel;
    isSimulation?: boolean;
    metadata?: Record<string, any>;
    evidenceHash?: string;
  }): Promise<void> {
    const nodes = params.kernel.getAllNodes();
    const edges = params.kernel.getAllEdges();
    const graphHash = this.computeGraphHash(nodes, edges);

    // Save snapshot first
    await this.saveSnapshot(params.id, params.kernel);

    try {
      await prisma.digitalTwinVersion.create({
        data: {
          id: params.id,
          parentVersionId: params.parentVersionId,
          snapshotId: params.id, // mapped 1-to-1
          graphHash,
          isSimulation: params.isSimulation || false,
          evidenceHash: params.evidenceHash || null,
          metadata: JSON.stringify(params.metadata || {}),
        }
      });
    } catch (err: any) {
      console.error('[GraphLifecycleManager] Failed to create version record:', err.message);
      throw err;
    }
  }

  /**
   * Reconstitutes a GraphKernel from database snapshots and mutations
   */
  public async loadVersion(versionId: string): Promise<GraphKernel> {
    const kernel = new GraphKernel();

    try {
      // 1. Locate the version record
      const versionRecord = await prisma.digitalTwinVersion.findUnique({
        where: { id: versionId }
      });

      if (!versionRecord) {
        throw new Error(`Graph version not found: ${versionId}`);
      }

      // 2. Fetch the base snapshot
      const snapshot = await prisma.digitalTwinSnapshot.findUnique({
        where: { graphVersionId: versionId }
      });

      if (!snapshot) {
        throw new Error(`Graph snapshot not found for version: ${versionId}`);
      }

      // 3. Deserialize base graph
      const data = JSON.parse(snapshot.serializedData) as {
        nodes: DigitalTwinNode[];
        edges: DigitalTwinEdge[];
      };

      for (const n of data.nodes) {
        kernel.addNode(n);
      }
      for (const e of data.edges) {
        kernel.addEdge(e);
      }

      // 4. Replay mutations that happened after the snapshot up to the version state
      // Note: Because snapshot is created at same timestamp, there are usually zero mutations
      // unless we are loading from a delta-based version. In this design, each version contains a snapshot.
      // But we can fetch any mutations specifically tagged for this version to ensure correctness.
      const mutations = await prisma.digitalTwinMutation.findMany({
        where: {
          graphVersionId: versionId,
          timestamp: { gte: snapshot.timestamp }
        },
        orderBy: { timestamp: 'asc' }
      });

      for (const m of mutations) {
        const payload = JSON.parse(m.payload);
        switch (m.mutationType) {
          case 'NODE_ADD':
            kernel.addNode(payload);
            break;
          case 'NODE_UPDATE':
            if (m.nodeId) kernel.updateNode(m.nodeId, payload);
            break;
          case 'NODE_REMOVE':
            if (m.nodeId) kernel.removeNode(m.nodeId);
            break;
          case 'EDGE_ADD':
            kernel.addEdge(payload);
            break;
          case 'EDGE_UPDATE':
            if (m.edgeSourceId && m.edgeTargetId && payload.relationship) {
              kernel.updateEdge(m.edgeSourceId, m.edgeTargetId, payload.relationship, payload);
            }
            break;
          case 'EDGE_REMOVE':
            if (m.edgeSourceId && m.edgeTargetId && payload.relationship) {
              kernel.removeEdge(m.edgeSourceId, m.edgeTargetId, payload.relationship);
            }
            break;
        }
      }

    } catch (err: any) {
      console.error(`[GraphLifecycleManager] Failed to load version ${versionId}:`, err.message);
      throw err;
    }

    return kernel;
  }
}
export const graphLifecycleManager = GraphLifecycleManager.getInstance();
export default graphLifecycleManager;
