// src/platform/capability/CapabilityLearningEngine.ts
// Learning engine optimizing capability selection based on execution histories

import { ICapabilityRegistry } from "./types";
import { IEventPublisher, EventPriority, DeliveryPolicy } from "../core/events/types";
import { TenantContext } from "../core/storage/types";

export class CapabilityLearningEngine {
  constructor(
    private registry: ICapabilityRegistry,
    private eventPublisher: IEventPublisher
  ) {}

  /**
   * Logs a feedback entry mapping a task query classification to the capability id, updating the success statistics.
   */
  public async recordExecutionOutcome(
    capabilityId: string,
    outcome: { latencyMs: number; success: boolean },
    context: TenantContext
  ): Promise<void> {
    const cap = await this.registry.getCapability(capabilityId, context);
    if (!cap) return;

    // Update weights and success metrics in registry
    const totalCount = cap.usageCount + 1;
    const oldLatencySum = cap.averageLatencyMs * cap.usageCount;
    cap.averageLatencyMs = (oldLatencySum + outcome.latencyMs) / totalCount;

    const oldSuccessSum = cap.successRate * cap.usageCount;
    cap.successRate = (oldSuccessSum + (outcome.success ? 1.0 : 0.0)) / totalCount;
    cap.failureRate = 1.0 - cap.successRate;
    cap.usageCount = totalCount;

    // Update healthScore dynamically
    cap.healthScore = Math.max(0.0, 1.0 - cap.failureRate * 2.0);

    await this.registry.saveCapability(cap, context);

    // Save learning feedback record to events database via EventBus
    await this.eventPublisher.publish({
      id: `evt-learn-${Math.random().toString(36).slice(2, 9)}`,
      version: '1.0',
      timestamp: Date.now(),
      originatingSubsystem: 'CapabilityLearningEngine',
      category: 'learning',
      payload: {
        capabilityId,
        state: cap.status,
        durationMs: outcome.latencyMs,
        result: outcome.success ? "success" : "failure",
        diagnostics: `Learning engine processed execution stats. New success rate: ${cap.successRate.toFixed(4)}`
      },
      securityClassification: 'internal',
      tenantId: context.tenantId,
      workspaceId: context.workspaceId
    }, EventPriority.BACKGROUND, DeliveryPolicy.AT_MOST_ONCE);
  }

  /**
   * Suggests the best capability from a set of options based on historical success rates and latency efficiency.
   */
  public async selectOptimalCapability(
    options: string[],
    context: TenantContext
  ): Promise<{ optimalId: string; confidence: number }> {
    let optimalId = options[0];
    let bestUtility = -Infinity;

    for (const id of options) {
      const cap = await this.registry.getCapability(id, context);
      if (!cap) continue;

      // Basic utility formula: successRate - failureRate - (latencyMs / 1000)
      const utility = cap.successRate - cap.failureRate * 2.0 - (cap.averageLatencyMs / 1000.0);
      if (utility > bestUtility) {
        bestUtility = utility;
        optimalId = id;
      }
    }

    // Normalize confidence score between 0.0 and 1.0
    const confidence = Math.max(0.1, Math.min(1.0, 0.5 + bestUtility / 2.0));

    return { optimalId, confidence };
  }
}
