// src/platform/control-plane/PlatformDigitalTwin.ts
import { PlatformComponent, HealthStatus, LifecycleState, PlatformAlert, MetricDataPoint } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';
import { convergenceEngine } from './digital-twin/synchronization/ConvergenceEngine';
import { projectionsRegistry } from './digital-twin/projections/ProjectionsRegistry';

export class PlatformDigitalTwin {
  private static instance: PlatformDigitalTwin | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  private alerts: Map<string, PlatformAlert> = new Map();
  private latestMetrics: MetricDataPoint | null = null;
  private securityScore = 100;
  private runningJobs: any[] = [];
  private runningWorkflows: any[] = [];

  private constructor() {}

  public get cache(): Map<string, PlatformComponent> {
    const map = new Map<string, PlatformComponent>();
    const components = this.getAllComponents();
    for (const c of components) {
      map.set(c.id, c);
    }
    
    map.delete = (key: string) => {
      convergenceEngine.getCanonicalGraph().removeNode(key);
      return true;
    };
    
    map.set = (key: string, value: PlatformComponent) => {
      const kernel = convergenceEngine.getCanonicalGraph();
      if (!kernel.hasNode(key)) {
        kernel.addNode({
          id: key,
          type: 'Topology',
          version: '1.0.0',
          state: value.lifecycleState,
          health: value.status,
          properties: { name: value.name, capabilities: value.capabilities },
          labels: [value.category],
          source: 'cache-set',
          timestamp: Date.now()
        });
      } else {
        kernel.updateNode(key, {
          state: value.lifecycleState,
          health: value.status
        });
      }
      return map;
    };

    return map;
  }

  public static getInstance(): PlatformDigitalTwin {
    if (!PlatformDigitalTwin.instance) {
      PlatformDigitalTwin.instance = new PlatformDigitalTwin();
    }
    return PlatformDigitalTwin.instance;
  }

  public initialize(): void {
    // 1. Initialize the new Convergence Engine (which subscribes to events, reconciles, and self-heals)
    convergenceEngine.initialize();

    // 2. Local fallback subscriptions for legacy UI metrics/alerts
    eventPlatform.subscribe('MetricUpdated', (evt: any) => {
      this.latestMetrics = evt.payload;
    });

    eventPlatform.subscribe('AlertRaised', (evt: any) => {
      const alert = evt.payload.alert;
      if (alert) this.alerts.set(alert.id, alert);
    });

    eventPlatform.subscribe('AlertResolved', (evt: any) => {
      const { alertId } = evt.payload;
      this.alerts.delete(alertId);
    });
  }

  public reconcileFromDiscovery(): void {
    convergenceEngine.reconcile().catch(err => {
      console.error('[PlatformDigitalTwin] Reconciliation trigger failed:', err);
    });
  }

  public getComponent(id: string): PlatformComponent | undefined {
    const node = convergenceEngine.getCanonicalGraph().getNode(id);
    if (!node) return undefined;
    return this.mapNodeToComponent(node);
  }

  public getAllComponents(): PlatformComponent[] {
    const nodes = convergenceEngine.getCanonicalGraph().getAllNodes();
    return nodes.map(n => this.mapNodeToComponent(n));
  }

  public getTopology(): { nodes: any[]; links: any[] } {
    const topo = projectionsRegistry.getTopology(convergenceEngine.getCanonicalGraph());
    
    const nodes = topo.nodes.map(n => ({
      id: n.id,
      name: n.properties.name || n.id,
      category: n.labels[0] || 'process',
      status: n.health,
      lifecycle: n.state
    }));

    const links = topo.edges.map(e => ({
      from: e.source,
      to: e.target
    }));

    return { nodes, links };
  }

  public getLatestMetrics(): MetricDataPoint | null {
    return this.latestMetrics;
  }

  public getActiveAlerts(): PlatformAlert[] {
    return Array.from(this.alerts.values());
  }

  public getSecurityScore(): number {
    return this.securityScore;
  }

  public setSecurityScore(score: number): void {
    this.securityScore = score;
  }

  public getRunningJobs(): any[] {
    return [...this.runningJobs];
  }

  public registerRunningJob(job: any): void {
    this.runningJobs = this.runningJobs.filter(j => j.id !== job.id);
    this.runningJobs.push(job);
  }

  public removeRunningJob(jobId: string): void {
    this.runningJobs = this.runningJobs.filter(j => j.id !== jobId);
  }

  public getRunningWorkflows(): any[] {
    return [...this.runningWorkflows];
  }

  public registerRunningWorkflow(wf: any): void {
    this.runningWorkflows = this.runningWorkflows.filter(w => w.id !== wf.id);
    this.runningWorkflows.push(wf);
  }

  public removeRunningWorkflow(wfId: string): void {
    this.runningWorkflows = this.runningWorkflows.filter(w => w.id !== wfId);
  }

  // --- Helpers ---

  private mapNodeToComponent(node: any): PlatformComponent {
    const kernel = convergenceEngine.getCanonicalGraph();
    const dependencies = kernel.getOutgoingEdges(node.id)
      .filter(e => e.relationship === 'depends-on')
      .map(e => e.target);

    return {
      id: node.id,
      name: node.properties.name || node.id,
      category: (node.labels[0] || 'process') as any,
      status: node.health,
      lifecycleState: node.state,
      dependencies,
      capabilities: node.properties.capabilities || [],
    };
  }
}
export const platformDigitalTwin = PlatformDigitalTwin.getInstance();
export default platformDigitalTwin;
