// src/platform/capability/CapabilityLifecycleManager.ts
// Subsystem facade coordinating the AegisOS Adaptive Capability Lifecycle

import { CapabilityRegistry } from "./CapabilityRegistry";
import { CapabilityDiscoveryService } from "./CapabilityDiscoveryService";
import { CapabilitySandboxManager } from "./CapabilitySandboxManager";
import { CapabilityScheduler } from "./CapabilityScheduler";
import { CapabilityLearningEngine } from "./CapabilityLearningEngine";
import { CapabilityGarbageCollector } from "./CapabilityGarbageCollector";
import { CapabilityTelemetryService } from "./CapabilityTelemetryService";
import { CapabilityTrustManager } from "./CapabilityTrustManager";
import { CapabilityMetadata, AssessmentResult } from "./types";

export class CapabilityLifecycleManager {
  private static instance: CapabilityLifecycleManager | null = null;
  
  public readonly registry = CapabilityRegistry.getInstance();
  public readonly discovery = CapabilityDiscoveryService.getInstance();
  public readonly sandbox = CapabilitySandboxManager.getInstance();
  public readonly scheduler = CapabilityScheduler.getInstance();
  public readonly learning = CapabilityLearningEngine.getInstance();
  public readonly gc = CapabilityGarbageCollector.getInstance();
  public readonly telemetry = CapabilityTelemetryService.getInstance();
  public readonly trust = CapabilityTrustManager.getInstance();

  private isStarted = false;

  private constructor() {}

  public static getInstance(): CapabilityLifecycleManager {
    if (!CapabilityLifecycleManager.instance) {
      CapabilityLifecycleManager.instance = new CapabilityLifecycleManager();
    }
    return CapabilityLifecycleManager.instance;
  }

  /**
   * Initializes and boots the capability lifecycle subsystem, seeding tables and starting background GC.
   */
  public async start(): Promise<void> {
    if (this.isStarted) return;

    console.log("[CapabilityLifecycleManager] Initializing capability subsystem...");
    await this.registry.init();
    
    // Start background garbage collector (checks every 10 seconds for testing/concurrency responsiveness)
    this.gc.start(10000);
    this.isStarted = true;
    console.log("[CapabilityLifecycleManager] Capability subsystem online.");
  }

  /**
   * Shuts down the subsystem, stopping garbage collection loops and closing database handles.
   */
  public async shutdown(): Promise<void> {
    if (!this.isStarted) return;
    this.gc.stop();
    await this.registry.getStore().close();
    this.isStarted = false;
    console.log("[CapabilityLifecycleManager] Capability subsystem offline.");
  }

  /**
   * Execution gateway method to assess task capability gaps, dynamically acquire missing items, and set up sandbox environments.
   */
  public async assessAndAcquire(
    taskName: string,
    requiredCapabilities: string[]
  ): Promise<Record<string, AssessmentResult>> {
    if (!this.isStarted) {
      await this.start();
    }

    // 1. Run gap assessment
    const assessment = await this.discovery.assessTaskRequirements(requiredCapabilities);

    for (const capId of requiredCapabilities) {
      const result = assessment[capId];

      if (result.status === "Impossible") {
        throw new Error(`[CapabilityLifecycleManager] Execution blocked. Required capability "${capId}" is impossible to satisfy.`);
      }

      let cap: CapabilityMetadata | null = null;

      if (result.status === "Acquirable") {
        // 2. Perform dynamic acquisition
        cap = await this.discovery.acquireCapability(capId);
        result.status = "Cached"; // Updated status
      } else {
        cap = await this.registry.getCapability(capId);
      }

      if (cap) {
        // 3. Transition through state scheduler to LOADED/READY/ACTIVE
        await this.scheduler.transition(capId, "LOADED", `task_trigger:${taskName}`);
        await this.scheduler.transition(capId, "READY", `task_trigger:${taskName}`);

        // 4. Sandbox Setup & least-privilege checks
        await this.sandbox.setupSandbox(cap);
        await this.scheduler.transition(capId, "ACTIVE", `task_trigger:${taskName}`);

        // Audit Event Logging
        await this.telemetry.logEvent({
          capabilityId: capId,
          eventType: "activation",
          state: "ACTIVE",
          durationMs: cap.averageLatencyMs,
          resourceUsage: {
            ramMb: cap.sandboxPolicy.ramBudgetMb,
            vramMb: cap.sandboxPolicy.vramBudgetMb
          },
          trigger: `task:${taskName}`,
          result: "success"
        });
      }
    }

    return assessment;
  }

  /**
   * Releases capability back to scheduling control, logging stats and tearing down sandbox environments.
   */
  public async releaseCapability(
    id: string,
    success: boolean,
    latencyMs: number
  ): Promise<void> {
    if (!this.isStarted) return;

    // 1. Train model/heuristics learning engine
    await this.learning.recordExecutionOutcome(id, { success, latencyMs });

    // 2. Sandbox Teardown
    await this.sandbox.teardownSandbox(id);

    // 3. Transition to IDLE/SUSPENDED state
    await this.scheduler.transition(id, "IDLE", "task_release");

    // Audit Event Logging
    await this.telemetry.logEvent({
      capabilityId: id,
      eventType: "deactivation",
      state: "IDLE",
      durationMs: latencyMs,
      resourceUsage: {},
      trigger: "task_release",
      result: success ? "success" : "failure"
    });
  }
}
export const capabilityLifecycleManager = CapabilityLifecycleManager.getInstance();
export default capabilityLifecycleManager;
