// src/platform/control-plane/PlatformOperationsControlPlane.ts
import { PlatformComponent, HealthStatus, LifecycleState } from './types';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';
import { platformLifecycleOrchestrator } from './PlatformLifecycleOrchestrator';
import { platformHealthEngine } from './PlatformHealthEngine';
import { selfHealingFramework } from './SelfHealingFramework';
import { platformAlertingFramework } from './PlatformAlertingFramework';
import { platformAutomationEngine } from './PlatformAutomationEngine';
import { observabilityAggregator } from './ObservabilityAggregator';
import { eventPlatform } from '../event-bus/EventPlatform';
import { platformDigitalTwin } from './PlatformDigitalTwin';
import { lifecycleStateMachine } from './LifecycleStateMachine';

export interface ComponentRegistrationPayload {
  name: string;
  category: PlatformComponent['category'];
  dependencies?: string[];
  capabilities?: string[];
  healthHandler?: () => Promise<{ status: HealthStatus; message?: string }>;
  metricsHandler?: () => Promise<Record<string, number>>;
  commands?: Record<string, () => void | Promise<any>>;
  ownerModule?: string;
  metadata?: Record<string, any>;
}

export class PlatformOperationsControlPlane {
  private static instance: PlatformOperationsControlPlane | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  private bootstrapped = false;

  private constructor() {}

  public static getInstance(): PlatformOperationsControlPlane {
    if (!PlatformOperationsControlPlane.instance) {
      PlatformOperationsControlPlane.instance = new PlatformOperationsControlPlane();
    }
    return PlatformOperationsControlPlane.instance;
  }

  /**
   * Initializes and boots the evolved central Operations Control Plane.
   */
  public async initialize(): Promise<void> {
    if (this.bootstrapped) return;
    this.bootstrapped = true;

    console.log('[ControlPlane] Initializing evolved Platform Operations Control Plane...');

    // 1. Initial Discovery scan
    await this.discovery.discover();

    // 2. Register states into Lifecycle FSM
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      lifecycleStateMachine.registerComponentState(c.id, c.lifecycleState);
    }

    // 3. Initialize Digital Twin cache
    platformDigitalTwin.initialize();

    // 4. Setup dependency graph topological structures
    platformLifecycleOrchestrator.rebuildGraph();

    // 5. Initialize alerts and self-healing watchdog loops
    platformAlertingFramework.initialize();
    selfHealingFramework.initialize();

    // 6. Start health checks, metrics, and continuous discovery loops
    platformHealthEngine.startHealthCheckLoop();
    observabilityAggregator.startAggregationLoop();
    this.discovery.startContinuousDiscovery();

    await eventPlatform.publish({
      name: 'ComponentRegistered',
      source: 'control-plane',
      payload: {
        component: {
          id: 'service:control-plane',
          name: 'Operations Control Plane Core',
          category: 'openclaw',
          status: 'healthy',
          lifecycleState: 'running',
          dependencies: [],
          capabilities: ['system-orchestration', 'health-audit'],
          ownerModule: 'platform'
        }
      }
    });

    console.log('[ControlPlane] Evolved Platform Operations Control Plane successfully started.');
  }

  /**
   * Extensibility Framework: registers custom external modules into state machines and topology.
   */
  public registerPlatformComponent(payload: ComponentRegistrationPayload): string {
    const id = `plugin:custom:${payload.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36).slice(2, 6)}`;
    
    const component: PlatformComponent = {
      id,
      name: payload.name,
      category: payload.category,
      status: 'healthy',
      lifecycleState: 'ready',
      dependencies: payload.dependencies || [],
      capabilities: payload.capabilities || [],
      ownerModule: payload.ownerModule || 'plugin',
      metadata: payload.metadata || {},
      commands: payload.commands || {},
      healthHandler: payload.healthHandler ? async () => {
        const res = await payload.healthHandler!();
        return {
          status: res.status,
          message: res.message,
          latencyMs: 1,
          timestamp: Date.now()
        };
      } : undefined,
      metricsHandler: payload.metricsHandler
    };

    // Inject into discovery inventory map
    (this.discovery as any).inventory.set(id, component);
    
    // Register FSM state
    lifecycleStateMachine.registerComponentState(id, 'ready');

    // Sync Digital Twin
    platformDigitalTwin.reconcileFromDiscovery();

    // Rebuild dependency graph
    platformLifecycleOrchestrator.rebuildGraph();

    // Log registration event
    eventPlatform.publish({
      name: 'ComponentRegistered',
      source: 'control-plane',
      payload: { component }
    });

    console.log(`[ControlPlane] Evolved Custom component registered: ${payload.name} (${id})`);
    return id;
  }

  /**
   * Cleans up timers and shuts down control plane loops.
   */
  public shutdown(): void {
    platformHealthEngine.stopHealthCheckLoop();
    observabilityAggregator.stopAggregationLoop();
    platformAutomationEngine.shutdownAllTimers();
    this.discovery.stopContinuousDiscovery();
    this.bootstrapped = false;
    console.log('[ControlPlane] Platform Operations Control Plane shut down.');
  }
}
export const platformOperationsControlPlane = PlatformOperationsControlPlane.getInstance();
export default platformOperationsControlPlane;
