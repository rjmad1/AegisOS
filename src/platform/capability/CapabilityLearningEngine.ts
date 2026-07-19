// src/platform/capability/CapabilityLearningEngine.ts
// Learning engine optimizing capability selection based on execution histories

import { SQLiteCapabilityStore } from "./SQLiteCapabilityStore";
import { CapabilityRegistry } from "./CapabilityRegistry";

export class CapabilityLearningEngine {
  private static instance: CapabilityLearningEngine | null = null;
  private store: SQLiteCapabilityStore;
  private registry: CapabilityRegistry;

  private constructor() {
    this.registry = CapabilityRegistry.getInstance();
    this.store = this.registry.getStore();
  }

  public static getInstance(): CapabilityLearningEngine {
    if (!CapabilityLearningEngine.instance) {
      CapabilityLearningEngine.instance = new CapabilityLearningEngine();
    }
    return CapabilityLearningEngine.instance;
  }

  /**
   * Logs a feedback entry mapping a task query classification to the capability id, updating the success statistics.
   */
  public async recordExecutionOutcome(
    capabilityId: string,
    outcome: { latencyMs: number; success: boolean }
  ): Promise<void> {
    const cap = await this.registry.getCapability(capabilityId);
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

    await this.registry.saveCapability(cap);

    // Save learning feedback record to events database
    await this.store.logEvent({
      id: `evt-learn-${Math.random().toString(36).slice(2, 9)}`,
      capabilityId,
      timestamp: new Date().toISOString(),
      eventType: "learning",
      state: cap.status,
      durationMs: outcome.latencyMs,
      resourceUsage: {},
      trigger: "feedback_loop",
      result: outcome.success ? "success" : "failure",
      diagnostics: `Learning engine processed execution stats. New success rate: ${cap.successRate.toFixed(4)}`
    });
  }

  /**
   * Suggests the best capability from a set of options based on historical success rates and latency efficiency.
   */
  public async selectOptimalCapability(
    options: string[]
  ): Promise<{ optimalId: string; confidence: number }> {
    let optimalId = options[0];
    let bestUtility = -Infinity;

    for (const id of options) {
      const cap = await this.registry.getCapability(id);
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
export const capabilityLearningEngine = CapabilityLearningEngine.getInstance();
export default capabilityLearningEngine;
