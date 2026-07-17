// src/platform/control-plane/PlatformDigitalTwin.ts
import { PlatformComponent, HealthStatus, LifecycleState, PlatformAlert, MetricDataPoint } from './types';
import { eventPlatform } from '../event-bus/EventPlatform';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';

export class PlatformDigitalTwin {
  private static instance: PlatformDigitalTwin | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  private cache: Map<string, PlatformComponent> = new Map();
  private alerts: Map<string, PlatformAlert> = new Map();
  private latestMetrics: MetricDataPoint | null = null;
  private securityScore = 100;
  private runningJobs: any[] = [];
  private runningWorkflows: any[] = [];

  private constructor() {}

  public static getInstance(): PlatformDigitalTwin {
    if (!PlatformDigitalTwin.instance) {
      PlatformDigitalTwin.instance = new PlatformDigitalTwin();
    }
    return PlatformDigitalTwin.instance;
  }

  public initialize(): void {
    // 1. Sync initial discovered resources
    this.reconcileFromDiscovery();

    // 2. Subscribe to state transitions
    eventPlatform.subscribe('HealthChanged', (evt: any) => {
      const { componentId, newState } = evt.payload;
      const comp = this.cache.get(componentId);
      if (comp) {
        comp.lifecycleState = newState;
        // Map lifecycle to general status
        if (newState === 'running') comp.status = 'healthy';
        else if (newState === 'failed' || newState === 'error') comp.status = 'critical';
        else if (newState === 'degraded' || newState === 'healing') comp.status = 'degraded';
        else if (newState === 'stopped') comp.status = 'offline';
      }
    });

    // 3. Subscribe to dynamic component additions
    eventPlatform.subscribe('ComponentRegistered', (evt: any) => {
      const comp = evt.payload.component;
      if (comp) {
        this.cache.set(comp.id, comp);
      }
    });

    eventPlatform.subscribe('ComponentRemoved', (evt: any) => {
      const { componentId } = evt.payload;
      this.cache.delete(componentId);
    });

    // 4. Subscribe to metric feeds
    eventPlatform.subscribe('MetricUpdated', (evt: any) => {
      this.latestMetrics = evt.payload;
    });

    // 5. Subscribe to Alerts
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
    const list = this.discovery.getAllComponents();
    for (const c of list) {
      this.cache.set(c.id, { ...c });
    }
  }

  public getComponent(id: string): PlatformComponent | undefined {
    return this.cache.get(id);
  }

  public getAllComponents(): PlatformComponent[] {
    return Array.from(this.cache.values());
  }

  public getTopology(): { nodes: any[]; links: any[] } {
    const nodes = this.getAllComponents().map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      status: c.status,
      lifecycle: c.lifecycleState
    }));

    const links: any[] = [];
    for (const c of this.getAllComponents()) {
      for (const depId of c.dependencies) {
        if (this.cache.has(depId)) {
          links.push({ from: depId, to: c.id });
        }
      }
    }

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
}
export const platformDigitalTwin = PlatformDigitalTwin.getInstance();
export default platformDigitalTwin;
