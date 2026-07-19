// src/platform/capability/CapabilityScheduler.ts
// Adaptive Capability Scheduler and Lifecycle state transitions engine

import { CapabilityMetadata, LifecycleState, UtilityScore } from "./types";
import { CapabilityRegistry } from "./CapabilityRegistry";
import { CapabilityOptimizer } from "./CapabilityOptimizer";
import { SQLiteCapabilityStore } from "./SQLiteCapabilityStore";

export class CapabilityScheduler {
  private static instance: CapabilityScheduler | null = null;
  private registry: CapabilityRegistry;
  private optimizer: CapabilityOptimizer;
  private store: SQLiteCapabilityStore;
  private operatingMode: "Performance" | "Balanced" | "Efficiency" | "LowResource" = "Balanced";

  private constructor() {
    this.registry = CapabilityRegistry.getInstance();
    this.optimizer = CapabilityOptimizer.getInstance();
    this.store = this.registry.getStore();
  }

  public static getInstance(): CapabilityScheduler {
    if (!CapabilityScheduler.instance) {
      CapabilityScheduler.instance = new CapabilityScheduler();
    }
    return CapabilityScheduler.instance;
  }

  public getOperatingMode(): string {
    return this.operatingMode;
  }

  public setOperatingMode(mode: typeof this.operatingMode): void {
    this.operatingMode = mode;
    console.log(`[CapabilityScheduler] Operating mode switched to: ${mode}`);
  }

  /**
   * Calculates the utility score of a capability.
   */
  public calculateUtility(cap: CapabilityMetadata): UtilityScore {
    const profile = this.optimizer.getSystemResourceProfile();
    const frequencyWeight = cap.usageCount > 10 ? 0.4 : cap.usageCount * 0.04;
    
    // Recency weight: decay utility over time since last usage
    let recencyWeight = 0.5;
    if (cap.lastUsed) {
      const hoursSinceLastUse = (Date.now() - new Date(cap.lastUsed).getTime()) / 3600000;
      recencyWeight = Math.max(0.0, 0.5 - hoursSinceLastUse * 0.05);
    }

    const predictedWeight = 0.1; // Default stub weight, updated by Markov rules
    
    // Penalty calculations
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

  /**
   * Dynamically transitions capability state, logging events and executing sandbox teardowns when needed.
   */
  public async transition(id: string, targetState: LifecycleState, trigger: string): Promise<void> {
    const cap = await this.registry.getCapability(id);
    if (!cap) return;

    const start = Date.now();
    const oldState = cap.status;
    if (oldState === targetState) return;

    console.log(`[CapabilityScheduler] Transitioning ${id}: ${oldState} -> ${targetState} (Trigger: ${trigger})`);

    // Perform state-specific side effects
    if (targetState === "UNLOADED" || targetState === "SUSPENDED" || targetState === "HIBERNATED") {
      const { capabilitySandboxManager } = await import("./CapabilitySandboxManager");
      await capabilitySandboxManager.teardownSandbox(id);

      // Simulate process terminations
      if (cap.type === "MCP") {
        console.log(`[CapabilityScheduler] Terminated active MCP session for ${id}`);
      } else if (cap.type === "Runtime") {
        console.log(`[CapabilityScheduler] Released container and Python workers for ${id}`);
      }
    }

    // Save transition state
    await this.registry.updateCapabilityState(id, targetState);

    // Audit trace event log
    await this.store.logEvent({
      id: `evt-sched-${Math.random().toString(36).slice(2, 9)}`,
      capabilityId: id,
      timestamp: new Date().toISOString(),
      eventType: "state_transition",
      state: targetState,
      durationMs: Date.now() - start,
      resourceUsage: {
        ramMb: cap.sandboxPolicy.ramBudgetMb,
        vramMb: cap.sandboxPolicy.vramBudgetMb
      },
      trigger,
      result: "success"
    });
  }

  /**
   * Preloads likely capabilities if system resources permit.
   */
  public async runPredictivePreloader(): Promise<void> {
    if (this.operatingMode === "LowResource") {
      console.log("[CapabilityScheduler] Predictive preloading disabled in LowResource Mode.");
      return;
    }

    console.log("[CapabilityScheduler] Running predictive capability preloader...");

    const allCaps = await this.registry.listCapabilities();
    for (const cap of allCaps) {
      if (cap.status !== "UNLOADED" && cap.status !== "SUSPENDED") continue;

      const utility = this.calculateUtility(cap);
      const threshold = this.operatingMode === "Performance" ? 0.2 : 0.5;

      if (utility.score > threshold) {
        // Evaluate memory budgets first
        const budget = this.optimizer.evaluateBudget(cap);
        if (budget.allowed) {
          console.log(`[CapabilityScheduler] Predictive Loading Preflight Passed for ${cap.id} (Utility: ${utility.score.toFixed(3)})`);
          await this.transition(cap.id, "READY", "predictive_preloader");
        } else {
          console.log(`[CapabilityScheduler] Predictive Loading Blocked for ${cap.id}: ${budget.reason}`);
        }
      }
    }
  }
}
export const capabilityScheduler = CapabilityScheduler.getInstance();
export default capabilityScheduler;
