// src/platform/control-plane/PlatformHealthEngine.ts
import { PlatformComponent, HealthStatus, HealthCheckResult } from './types';
import { InfrastructureDiscoveryEngine } from './InfrastructureDiscoveryEngine';
import { eventPlatform } from '../event-bus/EventPlatform';
import { deploymentManager } from '../../infrastructure/deployment/deployment-manager';

export class PlatformHealthEngine {
  private static instance: PlatformHealthEngine | null = null;
  private discovery = InfrastructureDiscoveryEngine.getInstance();
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): PlatformHealthEngine {
    if (!PlatformHealthEngine.instance) {
      PlatformHealthEngine.instance = new PlatformHealthEngine();
    }
    return PlatformHealthEngine.instance;
  }

  public startHealthCheckLoop(intervalMs = 10000): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(async () => {
      await this.runHealthChecks();
    }, intervalMs);
  }

  public stopHealthCheckLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Run health checks on all registered services and components.
   */
  public async runHealthChecks(): Promise<Record<string, HealthStatus>> {
    const components = this.discovery.getAllComponents();
    const results: Record<string, HealthStatus> = {};

    for (const comp of components) {
      const oldStatus = comp.status;
      let newStatus: HealthStatus = 'healthy';
      let message = '';
      const start = Date.now();

      try {
        if (comp.healthHandler) {
          const res = await comp.healthHandler();
          newStatus = res.status;
          message = res.message || '';
        } else if (comp.port) {
          const active = await deploymentManager.checkPort(comp.port);
          if (!active) {
            newStatus = comp.lifecycleState === 'stopped' ? 'offline' : 'critical';
            message = `Port ${comp.port} is unresponsive.`;
          } else {
            // Check latency
            const latency = Date.now() - start;
            if (latency > 1500) {
              newStatus = 'degraded';
              message = `Port responding slowly (${latency}ms).`;
            } else {
              newStatus = 'healthy';
            }
          }
        }
      } catch (err: any) {
        newStatus = 'critical';
        message = `Health check exception: ${err.message}`;
      }

      comp.status = newStatus;
      results[comp.id] = newStatus;

      // Publish health change event if status drifted
      if (oldStatus !== newStatus) {
        await eventPlatform.publish({
          name: 'health:changed',
          source: 'health-engine',
          payload: {
            entityId: comp.id,
            oldStatus,
            newStatus,
            message,
            timestamp: Date.now()
          }
        });
      }
    }

    return results;
  }

  public async evaluateSingleComponent(id: string): Promise<HealthCheckResult> {
    const comp = this.discovery.getComponent(id);
    if (!comp) return { status: 'unknown', message: 'Component not found', latencyMs: 0, timestamp: Date.now() };

    const start = Date.now();
    let status: HealthStatus = 'healthy';
    let message = 'Component responded normally.';

    if (comp.port) {
      const active = await deploymentManager.checkPort(comp.port);
      if (!active) {
        status = comp.lifecycleState === 'stopped' ? 'offline' : 'critical';
        message = `Listener port ${comp.port} is closed.`;
      }
    }

    return {
      status,
      message,
      latencyMs: Date.now() - start,
      timestamp: Date.now()
    };
  }
}
export const platformHealthEngine = PlatformHealthEngine.getInstance();
export default platformHealthEngine;
