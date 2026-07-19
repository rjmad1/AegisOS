import { CapabilityMetadata, LifecycleState, UtilityScore, ICapabilityScheduler, ICapabilityRegistry, ICapabilitySandbox, ICapabilityOptimizer } from "./types";
import { IEventPublisher, EventPriority, DeliveryPolicy } from "../core/events/types";
import { TenantContext } from "../core/storage/types";

export class CapabilityScheduler implements ICapabilityScheduler {
  private operatingMode: "Performance" | "Balanced" | "Efficiency" | "LowResource" = "Balanced";

  constructor(
    private registry: ICapabilityRegistry,
    private optimizer: ICapabilityOptimizer,
    private sandbox: ICapabilitySandbox,
    private eventPublisher: IEventPublisher
  ) {}

  public getOperatingMode(): string {
    return this.operatingMode;
  }

  public setOperatingMode(mode: typeof this.operatingMode): void {
    this.operatingMode = mode;
  }

  public calculateUtility(cap: CapabilityMetadata, context: TenantContext): UtilityScore {
    const frequencyWeight = cap.usageCount > 10 ? 0.4 : cap.usageCount * 0.04;
    
    let recencyWeight = 0.5;
    if (cap.lastUsed) {
      const hoursSinceLastUse = (Date.now() - new Date(cap.lastUsed).getTime()) / 3600000;
      recencyWeight = Math.max(0.0, 0.5 - hoursSinceLastUse * 0.05);
    }

    const predictedWeight = 0.1; 
    
    const initializationPenalty = (cap.averageLatencyMs / 1000.0) * 0.1;
    const resourcePenalty =
      ((cap.sandboxPolicy.ramBudgetMb / 1024.0) + (cap.sandboxPolicy.vramBudgetMb / 1024.0) * 2.0) * 0.05;

    const score = frequencyWeight + recencyWeight + predictedWeight - initializationPenalty - resourcePenalty;

    return {
      score,
      usageFrequency: cap.usageCount,
      recencyWeight,
      predictedWeight,
      initializationPenalty,
      resourcePenalty
    };
  }

  public prioritize(capabilities: CapabilityMetadata[], context: TenantContext): CapabilityMetadata[] {
    return capabilities.sort((a, b) => this.calculateUtility(b, context).score - this.calculateUtility(a, context).score);
  }

  public async transition(id: string, targetState: LifecycleState, trigger: string, context: TenantContext): Promise<void> {
    const cap = await this.registry.getCapability(id, context); 
    
    if (!cap) return;

    const start = Date.now();
    const oldState = cap.status;
    if (oldState === targetState) return;

    if (targetState === "UNLOADED" || targetState === "SUSPENDED" || targetState === "HIBERNATED") {
      // Simulated Sandbox Teardown via injected dependency
      // await this.sandbox.teardownSandbox(id);
    }

    cap.status = targetState;
    await this.registry.saveCapability(cap, context);

    await this.eventPublisher.publish({
      id: `evt-sched-${Math.random().toString(36).slice(2, 9)}`,
      version: '1.0',
      timestamp: Date.now(),
      originatingSubsystem: 'CapabilityScheduler',
      category: 'state_transition',
      payload: {
        capabilityId: id,
        oldState,
        newState: targetState,
        durationMs: Date.now() - start,
        trigger
      },
      securityClassification: 'internal',
      tenantId: context.tenantId,
      workspaceId: context.workspaceId
    }, EventPriority.NORMAL, DeliveryPolicy.AT_LEAST_ONCE);
  }
}
