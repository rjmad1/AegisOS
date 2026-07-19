import { 
  ICapabilityLifecycle, 
  ICapabilityRegistry, 
  ICapabilityScheduler, 
  ICapabilityDiscovery, 
  ICapabilitySandbox, 
  AssessmentResult, 
  CapabilityMetadata 
} from "./types";
import { IEventPublisher, EventPriority, DeliveryPolicy } from "../core/events/types";
import { TenantContext } from "../core/storage/types";

import { CapabilityRegistry } from "./CapabilityRegistry";
import { CapabilityScheduler } from "./CapabilityScheduler";
import { CapabilityDiscoveryService } from "./CapabilityDiscoveryService";
import { CapabilitySandboxManager } from "./CapabilitySandboxManager";
import { PlatformEventFabric } from "../core/events/PlatformEventFabric";
import { InMemoryTransport } from "../core/events/transports/InMemoryTransport";
import { TenantStorageManager } from "../core/storage/TenantStorageManager";

export class CapabilityLifecycleManager implements ICapabilityLifecycle {
  private static instance: CapabilityLifecycleManager | null = null;

  constructor(
    private registry: ICapabilityRegistry,
    private discovery: ICapabilityDiscovery,
    private sandbox: ICapabilitySandbox,
    private scheduler: ICapabilityScheduler,
    private eventPublisher: IEventPublisher
  ) {
    CapabilityLifecycleManager.instance = this;
  }
  public static getInstance(): CapabilityLifecycleManager {
    if (!CapabilityLifecycleManager.instance) {
      const transport = new InMemoryTransport();
      const eventFabric = new PlatformEventFabric(transport);
      const storageManager = new TenantStorageManager({
        initialize: async () => {},
        shutdown: async () => {},
        getCapability: async (id) => ({
          id,
          name: "Mock Capability",
          type: "MCP",
          version: "1.0.0",
          publisher: "AegisOS",
          repository: "",
          trustScore: 1.0,
          status: "ACTIVE",
          installedAt: new Date().toISOString(),
          usageCount: 0,
          averageLatencyMs: 10,
          dependencyGraph: [],
        }),
        saveCapability: async () => {},
        listCapabilities: async () => []
      });
      const registry = new CapabilityRegistry(storageManager);
      const scheduler = new CapabilityScheduler(
        registry,
        { optimize: async () => {} } as any,
        { applyPolicy: async () => {} } as any,
        eventFabric
      );
      const discovery = new CapabilityDiscoveryService();
      const sandbox = new CapabilitySandboxManager();
      
      CapabilityLifecycleManager.instance = new CapabilityLifecycleManager(
        registry,
        discovery,
        sandbox,
        scheduler,
        eventFabric
      );
    }
    return CapabilityLifecycleManager.instance;
  }

  public async assessCapability(intent: string, context: TenantContext): Promise<AssessmentResult> {
    const caps = await this.discovery.discover(intent, context);
    if (caps.length > 0) {
      return { status: "Cached", reason: "Found locally", confidenceScore: 1.0, capabilityId: caps[0].id };
    }
    return { status: "Acquirable", reason: "Available remotely", confidenceScore: 0.8 };
  }

  public async acquireCapability(metadata: CapabilityMetadata, context: TenantContext): Promise<void> {
    await this.registry.saveCapability(metadata, context);
  }

  public async assessAndAcquire(taskName: string, requiredCapabilities: string[], context?: TenantContext): Promise<Record<string, AssessmentResult>> {
    const results: Record<string, AssessmentResult> = {};
    const ctx = context || { tenantId: "default", workspaceId: "default" };

    for (const capId of requiredCapabilities) {
      let cap = await this.registry.getCapability(capId, ctx);
      if (!cap) {
        results[capId] = { status: "Impossible", reason: "Not found", confidenceScore: 0 };
        throw new Error(`Execution blocked. Capability ${capId} impossible.`);
      }

      await this.scheduler.transition(capId, "LOADED", `task_trigger:${taskName}`, ctx);
      await this.scheduler.transition(capId, "READY", `task_trigger:${taskName}`, ctx);
      
      await this.sandbox.applyPolicy(cap);
      await this.scheduler.transition(capId, "ACTIVE", `task_trigger:${taskName}`, ctx);

      await this.eventPublisher.publish({
        id: `evt-lcm-${Math.random().toString(36).slice(2, 9)}`,
        version: '1.0',
        timestamp: Date.now(),
        originatingSubsystem: 'CapabilityLifecycleManager',
        category: 'activation',
        payload: {
          capabilityId: capId,
          durationMs: cap.averageLatencyMs,
          trigger: `task:${taskName}`
        },
        securityClassification: 'internal',
        tenantId: ctx.tenantId,
        workspaceId: ctx.workspaceId
      }, EventPriority.NORMAL, DeliveryPolicy.AT_LEAST_ONCE);

      results[capId] = { status: "Cached", reason: "Loaded successfully", confidenceScore: 1.0 };
    }

    return results;
  }

  public async releaseCapability(capabilityId: string, success: boolean, durationMs: number, context?: TenantContext): Promise<void> {
    const ctx = context || { tenantId: "default", workspaceId: "default" };

    // Transition back to READY state using the scheduler
    await this.scheduler.transition(capabilityId, "READY", `release:success=${success}`, ctx);

    // Publish event
    await this.eventPublisher.publish({
      id: `evt-lcm-rel-${Math.random().toString(36).slice(2, 9)}`,
      version: '1.0',
      timestamp: Date.now(),
      originatingSubsystem: 'CapabilityLifecycleManager',
      category: 'deactivation',
      payload: {
        capabilityId,
        success,
        durationMs
      },
      securityClassification: 'internal',
      tenantId: ctx.tenantId,
      workspaceId: ctx.workspaceId
    }, EventPriority.NORMAL, DeliveryPolicy.AT_LEAST_ONCE);
  }
}
