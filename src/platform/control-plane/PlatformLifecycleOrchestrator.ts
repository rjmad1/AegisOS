// src/platform/control-plane/PlatformLifecycleOrchestrator.ts
import { DependencyGraphSolver } from './DependencyGraphSolver';
import { PlatformServiceManager } from './PlatformServiceManager';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';
import { eventPlatform } from '../event-bus/EventPlatform';
import { LifecycleState, WorkflowStep } from './types';
import { platformWorkflowEngine } from './PlatformWorkflowEngine';

export class PlatformLifecycleOrchestrator {
  private static instance: PlatformLifecycleOrchestrator | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  private serviceManager = PlatformServiceManager.getInstance();
  private graphSolver = new DependencyGraphSolver();
  private currentMode: LifecycleState = 'stopped';

  private constructor() {}

  public static getInstance(): PlatformLifecycleOrchestrator {
    if (!PlatformLifecycleOrchestrator.instance) {
      PlatformLifecycleOrchestrator.instance = new PlatformLifecycleOrchestrator();
    }
    return PlatformLifecycleOrchestrator.instance;
  }

  public getPlatformMode(): LifecycleState {
    return this.currentMode;
  }

  public setPlatformMode(mode: LifecycleState): void {
    this.currentMode = mode;
  }

  public rebuildGraph(): void {
    this.graphSolver.clear();
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      this.graphSolver.addNode(c.id);
      for (const depId of c.dependencies) {
        this.graphSolver.addEdge(depId, c.id);
      }
    }
  }

  public getDependencyGraph(): any {
    this.rebuildGraph();
    return {
      nodes: this.discovery.getAllComponents().map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        status: c.status,
        lifecycle: c.lifecycleState
      })),
      edges: this.graphSolver.visualize()
    };
  }

  /**
   * Orchestrates the platform start sequence using Workflow steps.
   */
  public async startPlatform(dryRun = false): Promise<boolean> {
    this.currentMode = 'bootstrapping';
    this.rebuildGraph();

    let sortedIds: string[] = [];
    try {
      sortedIds = this.graphSolver.getTopologicalSort();
    } catch (err: any) {
      console.error('[LifecycleOrchestrator] Failed dependency topological sort:', err.message);
      this.currentMode = 'error';
      return false;
    }

    const steps: WorkflowStep[] = [];
    for (const id of sortedIds) {
      const comp = this.discovery.getComponent(id);
      if (comp && (comp.id.startsWith('service:') || comp.id.startsWith('vector:'))) {
        // Map dependencies to workflow step links
        const dependencies = comp.dependencies.filter(depId => 
          sortedIds.includes(depId) && (depId.startsWith('service:') || depId.startsWith('vector:'))
        );

        steps.push({
          id: `step-${id}`,
          name: `Start ${comp.name}`,
          dependsOn: dependencies.map(depId => `step-${depId}`),
          timeoutMs: 8000,
          status: 'pending',
          action: async () => {
            const ok = await this.serviceManager.startService(id, dryRun);
            if (!ok && !dryRun) throw new Error(`Service ${id} failed to start.`);
          },
          rollbackAction: async () => {
            await this.serviceManager.stopService(id);
          }
        });
      }
    }

    if (steps.length === 0) {
      this.currentMode = 'running';
      return true;
    }

    // Execute starting sequence via Workflow Engine
    const wfId = await platformWorkflowEngine.executeWorkflow('Morning Startup', steps);
    console.log(`[LifecycleOrchestrator] Started Morning Startup workflow: ${wfId}`);
    this.currentMode = 'running';
    return true;
  }

  /**
   * Orchestrates complete graceful safe platform shutdown using Workflow steps.
   */
  public async stopPlatform(dryRun = false): Promise<boolean> {
    this.currentMode = 'stopping';
    this.rebuildGraph();

    let reverseSortedIds: string[] = [];
    try {
      reverseSortedIds = this.graphSolver.getReverseTopologicalSort();
    } catch {
      reverseSortedIds = this.discovery.getAllComponents().map(c => c.id).reverse();
    }

    const steps: WorkflowStep[] = [];
    for (const id of reverseSortedIds) {
      const comp = this.discovery.getComponent(id);
      if (comp && (comp.id.startsWith('service:') || comp.id.startsWith('vector:'))) {
        steps.push({
          id: `step-stop-${id}`,
          name: `Stop ${comp.name}`,
          timeoutMs: 5000,
          status: 'pending',
          action: async () => {
            await this.serviceManager.stopService(id, dryRun);
          }
        });
      }
    }

    if (steps.length === 0) {
      this.currentMode = 'stopped';
      return true;
    }

    const wfId = await platformWorkflowEngine.executeWorkflow('Safe Shutdown', steps);
    console.log(`[LifecycleOrchestrator] Started Safe Shutdown workflow: ${wfId}`);
    this.currentMode = 'stopped';
    return true;
  }

  public async restartPlatform(dryRun = false): Promise<boolean> {
    const stopped = await this.stopPlatform(dryRun);
    if (!stopped && !dryRun) return false;
    return this.startPlatform(dryRun);
  }

  public async pausePlatform(): Promise<boolean> {
    this.currentMode = 'paused';
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      if (c.id.startsWith('service:') || c.id.startsWith('vector:')) {
        c.lifecycleState = 'paused';
      }
    }
    await eventPlatform.publish({
      name: 'ServiceStopped',
      source: 'lifecycle-orchestrator',
      payload: { timestamp: Date.now() }
    });
    return true;
  }

  public async resumePlatform(): Promise<boolean> {
    this.currentMode = 'running';
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      if (c.id.startsWith('service:') || c.id.startsWith('vector:')) {
        c.lifecycleState = 'running';
      }
    }
    await eventPlatform.publish({
      name: 'ServiceStarted',
      source: 'lifecycle-orchestrator',
      payload: { timestamp: Date.now() }
    });
    return true;
  }

  public enterMaintenanceMode(): void {
    this.currentMode = 'maintenance';
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      if (c.id.startsWith('service:') || c.id.startsWith('vector:')) {
        c.lifecycleState = 'maintenance';
      }
    }
    console.log('[LifecycleOrchestrator] Platform set to MAINTENANCE mode.');
  }

  public enterUpgradeMode(): void {
    this.currentMode = 'maintenance';
    console.log('[LifecycleOrchestrator] Platform entering UPGRADE mode.');
  }

  public async safeShutdown(): Promise<boolean> {
    console.log('[LifecycleOrchestrator] Beginning safe graceful shutdown...');
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.stopPlatform();
  }

  public async emergencyShutdown(): Promise<boolean> {
    console.warn('[LifecycleOrchestrator] EMERGENCY SHUTDOWN TRIGGERED! Killing all services immediately.');
    this.currentMode = 'stopped';
    const components = this.discovery.getAllComponents();
    const stopPromises = components
      .filter(c => c.id.startsWith('service:') || c.id.startsWith('vector:'))
      .map(c => this.serviceManager.stopService(c.id));
    
    await Promise.all(stopPromises);
    return true;
  }
}
export const platformLifecycleOrchestrator = PlatformLifecycleOrchestrator.getInstance();
export default platformLifecycleOrchestrator;
