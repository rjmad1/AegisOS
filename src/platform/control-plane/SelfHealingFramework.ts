// src/platform/control-plane/SelfHealingFramework.ts
import { HealthStatus, LifecycleState } from './types';
import { PlatformServiceManager } from './PlatformServiceManager';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';
import { eventPlatform } from '../event-bus/EventPlatform';
import { lifecycleStateMachine } from './LifecycleStateMachine';

export class SelfHealingFramework {
  private static instance: SelfHealingFramework | null = null;
  private serviceManager = PlatformServiceManager.getInstance();
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  
  // Guardrails
  private healingLock: Set<string> = new Set();
  private retryAttempts: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { tripped: boolean; timestamp: number }> = new Map();
  private consecutiveTrips: Map<string, number> = new Map();
  private lockedOutComponents: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): SelfHealingFramework {
    if (!SelfHealingFramework.instance) {
      SelfHealingFramework.instance = new SelfHealingFramework();
    }
    return SelfHealingFramework.instance;
  }

  public resetLockout(id: string): void {
    this.lockedOutComponents.delete(id);
    this.consecutiveTrips.set(id, 0);
    this.circuitBreakers.delete(id);
    this.retryAttempts.set(id, 0);
    console.log(`[SelfHealing] Lockout reset for component: ${id}`);
  }

  public initialize(): void {
    // 1. Subscribe to HealthChanged transitions
    eventPlatform.subscribe('HealthChanged', async (evt: any) => {
      const { componentId, newState } = evt.payload;
      if (newState === 'failed' || newState === 'degraded' || newState === 'error') {
        await this.handleUnhealthyComponent(componentId, newState);
      }
    });

    // 2. Setup Watchdog Heartbeat Monitoring loop
    setInterval(async () => {
      await this.runWatchdogAudit();
    }, 15000);
  }

  /**
   * Heartbeat Watchdog verification checks.
   */
  private async runWatchdogAudit(): Promise<void> {
    const components = this.discovery.getAllComponents();
    for (const comp of components) {
      // Check if service or vector store in running state is actually responding on port
      if (comp.lifecycleState === 'running' && comp.port) {
        const active = await this.canaryCheck(comp.port);
        if (!active) {
          console.warn(`[Watchdog] Heartbeat missed for "${comp.name}" on port ${comp.port}. Transitioning FSM.`);
          await lifecycleStateMachine.transition(comp.id, 'failed');
        }
      }
    }
  }

  private async canaryCheck(port: number): Promise<boolean> {
    const { deploymentManager } = await import('../../infrastructure/deployment/deployment-manager');
    return deploymentManager.checkPort(port);
  }

  /**
   * Evolved Autonomous Self-Healing logic.
   */
  private async handleUnhealthyComponent(id: string, state: LifecycleState): Promise<void> {
    if (this.lockedOutComponents.has(id)) {
      console.warn(`[SelfHealing] Component "${id}" is permanently locked out from self-healing.`);
      return;
    }

    if (this.healingLock.has(id)) return;
    this.healingLock.add(id);

    // Circuit Breaker check
    const cb = this.circuitBreakers.get(id) || { tripped: false, timestamp: 0 };
    if (cb.tripped) {
      const cooldown = 60000; // 1 minute cooldown
      if (Date.now() - cb.timestamp < cooldown) {
        console.warn(`[SelfHealing] Action blocked. Circuit breaker tripped for: ${id}`);
        this.healingLock.delete(id);
        return;
      } else {
        // Cooldown passed, reset circuit breaker
        this.circuitBreakers.set(id, { tripped: false, timestamp: 0 });
      }
    }

    const attempts = this.retryAttempts.get(id) || 0;
    const maxAttempts = 3;

    if (attempts >= maxAttempts) {
      // Trip the Circuit Breaker
      this.circuitBreakers.set(id, { tripped: true, timestamp: Date.now() });
      const trips = (this.consecutiveTrips.get(id) || 0) + 1;
      this.consecutiveTrips.set(id, trips);

      if (trips >= 2) {
        this.lockedOutComponents.add(id);
        await this.escalateHealingFailure(id, `Permanent lockout triggered after ${trips} consecutive circuit breaker trips.`);
      } else {
        await this.escalateHealingFailure(id, `Circuit breaker tripped after ${attempts} failed attempts.`);
      }
      this.retryAttempts.set(id, 0); // reset attempts counter
      this.healingLock.delete(id);
      return;
    }

    this.retryAttempts.set(id, attempts + 1);

    // Exponential Backoff computation
    const delay = process.env.NODE_ENV === 'test' ? 0 : Math.pow(2, attempts) * 1000;
    console.log(`[SelfHealing] Scheduling auto-repair for "${id}" (Attempt ${attempts + 1}/${maxAttempts}) in ${delay}ms...`);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    await eventPlatform.publish({
      name: 'AlertRaised',
      source: 'self-healing',
      payload: {
        alert: {
          id: `alert-heal-${id}-${Date.now()}`,
          severity: 'warning',
          entityId: id,
          message: `Attempting autonomous self-healing for ${id} (Attempt ${attempts + 1})`,
          timestamp: Date.now()
        }
      }
    });

    // Run repair strategy
    const repairSuccess = await this.serviceManager.repairService(id);

    if (repairSuccess) {
      // Canary Validation check
      const validation = await this.serviceManager.validateService(id);
      if (validation.valid) {
        this.retryAttempts.set(id, 0);
        console.log(`[SelfHealing] Successful auto-recovery & canary verification for: ${id}`);
        await eventPlatform.publish({
          name: 'AlertResolved',
          source: 'self-healing',
          payload: { alertId: `alert-heal-${id}-${Date.now()}` }
        });
      } else {
        await this.escalateHealingFailure(id, 'Repair was completed but canary validation failed.');
      }
    } else {
      await this.escalateHealingFailure(id, 'Service manager repair strategy execution failed.');
    }

    this.healingLock.delete(id);
  }

  private async escalateHealingFailure(id: string, reason: string): Promise<void> {
    console.warn(`[SelfHealing:Escalation] Recovery failed for component: ${id}. Reason: ${reason}`);
    
    await eventPlatform.publish({
      name: 'AlertRaised',
      source: 'self-healing',
      payload: {
        alert: {
          id: `alert-escalate-${id}-${Date.now()}`,
          severity: 'critical',
          entityId: id,
          message: `Autonomous recovery failed for "${id}". Escalation triggered: ${reason}`,
          timestamp: Date.now()
        }
      }
    });
  }
}
export const selfHealingFramework = SelfHealingFramework.getInstance();
export default selfHealingFramework;
