// src/platform/control-plane/digital-twin/synchronization/ConvergenceEngine.ts
import { GraphKernel } from '../core/GraphKernel';
import { GraphSyncProvider } from './GraphSyncProvider';
import { eventPlatform } from '../../../event-bus/EventPlatform';
import { graphLifecycleManager } from '../core/GraphLifecycleManager';
import { InfrastructureDiscoveryEngine } from '../../InfrastructureDiscoveryEngine';
import prisma from '../../../../infrastructure/db/prisma';

export class ConvergenceEngine {
  private static instance: ConvergenceEngine | null = null;
  private canonicalGraph: GraphKernel = new GraphKernel();
  private providers: GraphSyncProvider[] = [];
  private subIds: string[] = [];
  private reconciliationTimer: NodeJS.Timeout | null = null;
  private isReconciling = false;

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): ConvergenceEngine {
    if (!ConvergenceEngine.instance) {
      ConvergenceEngine.instance = new ConvergenceEngine();
    }
    return ConvergenceEngine.instance;
  }

  public getCanonicalGraph(): GraphKernel {
    return this.canonicalGraph;
  }

  /**
   * Registers a domain sync provider.
   */
  public registerProvider(provider: GraphSyncProvider): void {
    this.providers.push(provider);
  }

  /**
   * Initializes event subscriptions and starts reconciliation loop.
   */
  public initialize(): void {
    this.subIds.forEach(id => eventPlatform.unsubscribe(id));
    this.subIds = [];

    // Subscribe to EventPlatform state updates
    const eventsToWatch = [
      'ComponentRegistered',
      'ComponentRemoved',
      'HealthChanged',
      'AlertRaised',
      'AlertResolved',
      'MetricUpdated',
      'WorkflowStarted',
      'WorkflowCompleted',
      'SecurityViolationDetected',
      'ConfigurationChanged',
      'DependencyChanged'
    ];

    for (const eventName of eventsToWatch) {
      const subId = eventPlatform.subscribe(eventName, async (evt) => {
        await this.handleIncomingEvent(eventName, evt.payload);
      });
      this.subIds.push(subId);
    }

    // Trigger initial full reconciliation
    this.reconcile().catch(err => {
      console.error('[ConvergenceEngine] Initial reconciliation failed:', err);
    });

    // Start periodic 30-second reconciliation check loop
    if (this.reconciliationTimer) clearInterval(this.reconciliationTimer);
    this.reconciliationTimer = setInterval(() => {
      this.reconcile().catch(err => {
        console.error('[ConvergenceEngine] Periodic reconciliation failed:', err);
      });
    }, 30000);
  }

  /**
   * Shuts down loops and subscriptions.
   */
  public shutdown(): void {
    if (this.reconciliationTimer) {
      clearInterval(this.reconciliationTimer);
      this.reconciliationTimer = null;
    }
    this.subIds.forEach(id => eventPlatform.unsubscribe(id));
    this.subIds = [];
  }

  /**
   * Synchronizes the in-memory canonical graph with discovery inputs and database state.
   */
  public async reconcile(): Promise<void> {
    if (this.isReconciling) return;
    this.isReconciling = true;

    try {
      console.log('🔄 [ConvergenceEngine] Reconciling twin states...');
      
      // Execute each domain sync provider
      for (const provider of this.providers) {
        try {
          await provider.sync(this.canonicalGraph);
        } catch (err: any) {
          console.error(`[ConvergenceEngine] Provider "${provider.domainName}" failed sync:`, err.message);
        }
      }

      // Check drift against the active system state
      await this.runDriftDetection();

      // Commit consolidated version
      const versionId = `v-twin-${Date.now()}`;
      await graphLifecycleManager.createVersion({
        id: versionId,
        parentVersionId: null,
        kernel: this.canonicalGraph,
        metadata: {
          timestamp: Date.now(),
          reconciled: true,
          nodeCount: this.canonicalGraph.getAllNodes().length,
          edgeCount: this.canonicalGraph.getAllEdges().length
        }
      });

    } finally {
      this.isReconciling = false;
    }
  }

  /**
   * Run drift detection. Compares the running canonical graph structure with a fresh projection scan.
   */
  private async runDriftDetection(): Promise<void> {
    const testGraph = new GraphKernel();
    
    // Sync into testGraph to represent "Reality"
    for (const provider of this.providers) {
      try {
        await provider.sync(testGraph);
      } catch {}
    }

    const canonNodes = this.canonicalGraph.getAllNodes();
    const testNodes = testGraph.getAllNodes();

    let nodesDrifted = 0;
    const driftDetails: string[] = [];

    // Compare nodes
    for (const testNode of testNodes) {
      const canonNode = this.canonicalGraph.getNode(testNode.id);
      if (!canonNode) {
        nodesDrifted++;
        driftDetails.push(`Missing node in canonical graph: ${testNode.id}`);
      } else if (canonNode.health !== testNode.health || canonNode.state !== testNode.state) {
        nodesDrifted++;
        driftDetails.push(`Node state mismatch for ${testNode.id}: expected health=${testNode.health}, state=${testNode.state}; found health=${canonNode.health}, state=${canonNode.state}`);
      }
    }

    const detectedDrift = nodesDrifted > 0;

    if (detectedDrift) {
      console.warn(`⚠️ [ConvergenceEngine] Drift detected: ${nodesDrifted} nodes out of sync. Initiating self-healing...`);
      
      // Log to database
      try {
        await prisma.digitalTwinDriftLog.create({
          data: {
            expectedVersion: 'latest',
            detectedDrift: true,
            driftDetails: JSON.stringify(driftDetails),
            nodesDrifted,
            edgesDrifted: 0,
            repaired: true,
            repairAction: 'INCREMENTAL_RECONCILIATION',
            reconciledAt: new Date()
          }
        });
      } catch (err: any) {
        console.error('[ConvergenceEngine] Failed to save drift log:', err.message);
      }

      // Self-heal: Overwrite with corrected nodes
      this.selfHeal(testGraph);
    }
  }

  /**
   * Self-healing logic to align the canonical graph back to physical discovery reality.
   */
  private selfHeal(realGraph: GraphKernel): void {
    // Perform copy-on-write replacement of nodes
    const realNodes = realGraph.getAllNodes();
    for (const n of realNodes) {
      if (!this.canonicalGraph.hasNode(n.id)) {
        this.canonicalGraph.addNode({ ...n });
      } else {
        this.canonicalGraph.updateNode(n.id, {
          health: n.health,
          state: n.state,
          properties: n.properties,
          labels: n.labels
        });
      }
    }

    // Clean up nodes that no longer exist in real graph
    const canonNodes = this.canonicalGraph.getAllNodes();
    for (const cn of canonNodes) {
      if (!realGraph.hasNode(cn.id)) {
        this.canonicalGraph.removeNode(cn.id);
      }
    }

    // Re-align edges
    const realEdges = realGraph.getAllEdges();
    for (const e of realEdges) {
      this.canonicalGraph.addEdge({ ...e });
    }
  }

  /**
   * Process event notifications and incrementally update GraphKernel.
   */
  private async handleIncomingEvent(eventName: string, payload: any): Promise<void> {
    // Let providers check if they want to handle it first
    let handled = false;
    for (const provider of this.providers) {
      if (provider.handleEvent) {
        const didHandle = await provider.handleEvent(this.canonicalGraph, eventName, payload);
        if (didHandle) handled = true;
      }
    }

    if (handled) return;

    // Fallback default handlers
    switch (eventName) {
      case 'ComponentRegistered': {
        const c = payload.component;
        if (c) {
          this.canonicalGraph.addNode({
            id: c.id,
            type: this.mapCategoryToType(c.category),
            version: '1.0.0',
            state: c.lifecycleState || 'running',
            health: c.status || 'healthy',
            properties: { name: c.name, capabilities: c.capabilities || [] },
            labels: [c.category, 'component'],
            source: 'event',
            timestamp: Date.now()
          });
          // Add dependency edges
          if (c.dependencies) {
            for (const depId of c.dependencies) {
              this.canonicalGraph.addEdge({
                source: c.id,
                target: depId,
                relationship: 'depends-on',
                weight: 1,
                confidence: 1,
                properties: {}
              });
            }
          }
        }
        break;
      }
      case 'ComponentRemoved': {
        const { componentId } = payload;
        if (componentId) {
          this.canonicalGraph.removeNode(componentId);
        }
        break;
      }
      case 'HealthChanged': {
        const { componentId, newState } = payload;
        if (componentId && this.canonicalGraph.hasNode(componentId)) {
          this.canonicalGraph.updateNode(componentId, {
            state: newState,
            health: newState === 'failed' || newState === 'error' ? 'critical' : 'healthy'
          });
        }
        break;
      }
    }
  }

  private mapCategoryToType(category: string): any {
    if (['gpu', 'cpu', 'ram', 'storage-device'].includes(category)) return 'Resource';
    if (['database', 'vector-store'].includes(category)) return 'Resource';
    if (['ai-model'].includes(category)) return 'Provider';
    return 'Topology';
  }

  private registerDefaultProviders(): void {
    // 1. Topology & Infrastructure Sync Adapter
    this.registerProvider({
      domainName: 'Infrastructure',
      sync: async (kernel) => {
        const discovery = InfrastructureDiscoveryEngine.getInstance();
        const components = discovery.getAllComponents();

        for (const c of components) {
          const type = this.mapCategoryToType(c.category);
          
          if (!kernel.hasNode(c.id)) {
            kernel.addNode({
              id: c.id,
              type,
              version: '1.0.0',
              state: c.lifecycleState,
              health: c.status,
              properties: { name: c.name, capabilities: c.capabilities },
              labels: [c.category, 'infrastructure'],
              source: 'discovery',
              timestamp: Date.now()
            });
          } else {
            kernel.updateNode(c.id, {
              state: c.lifecycleState,
              health: c.status,
              properties: { name: c.name, capabilities: c.capabilities }
            });
          }

          // Build dependencies
          for (const depId of c.dependencies) {
            kernel.addEdge({
              source: c.id,
              target: depId,
              relationship: 'depends-on',
              weight: 1,
              confidence: 1,
              properties: {}
            });
          }
        }
      }
    });

    // 2. Capabilities Sync Adapter
    this.registerProvider({
      domainName: 'Capabilities',
      sync: async (kernel) => {
        // Query capability certificates from DB
        const certs = await prisma.capabilityCertification.findMany();
        for (const cert of certs) {
          const nodeId = `capability:${cert.capabilityId}`;
          if (!kernel.hasNode(nodeId)) {
            kernel.addNode({
              id: nodeId,
              type: 'Capability',
              version: cert.version,
              state: cert.status === 'CERTIFIED' ? 'running' : 'degraded',
              health: cert.status === 'CERTIFIED' ? 'healthy' : 'degraded',
              properties: { name: cert.name, score: cert.score },
              labels: ['capability'],
              source: 'db',
              timestamp: Date.now()
            });
          } else {
            kernel.updateNode(nodeId, {
              health: cert.status === 'CERTIFIED' ? 'healthy' : 'degraded',
              state: cert.status === 'CERTIFIED' ? 'running' : 'degraded',
              properties: { name: cert.name, score: cert.score }
            });
          }
        }
      }
    });
  }
}
export const convergenceEngine = ConvergenceEngine.getInstance();
export default convergenceEngine;
