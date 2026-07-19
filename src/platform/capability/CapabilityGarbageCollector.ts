// src/platform/capability/CapabilityGarbageCollector.ts
// Continuous background resource collector for AegisOS Capabilities

import { CapabilityRegistry } from "./CapabilityRegistry";
import { CapabilityScheduler } from "./CapabilityScheduler";

export class CapabilityGarbageCollector {
  private static instance: CapabilityGarbageCollector | null = null;
  private registry: CapabilityRegistry;
  private scheduler: CapabilityScheduler;
  private timer: NodeJS.Timeout | null = null;

  private constructor() {
    this.registry = CapabilityRegistry.getInstance();
    this.scheduler = CapabilityScheduler.getInstance();
  }

  public static getInstance(): CapabilityGarbageCollector {
    if (!CapabilityGarbageCollector.instance) {
      CapabilityGarbageCollector.instance = new CapabilityGarbageCollector();
    }
    return CapabilityGarbageCollector.instance;
  }

  /**
   * Starts the continuous background GC loop.
   */
  public start(intervalMs: number = 30000): void {
    if (this.timer) return;

    console.log(`[CapabilityGC] Starting background garbage collector with interval ${intervalMs}ms...`);
    this.timer = setInterval(() => {
      this.reclaimIdleCapabilities().catch(err => {
        console.error("[CapabilityGC] Error reclaiming capabilities:", err.message);
      });
    }, intervalMs);
  }

  /**
   * Stops the background GC loop.
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log("[CapabilityGC] Background garbage collector stopped.");
    }
  }

  /**
   * Identifies idle capabilities and unloads them from resident RAM/VRAM.
   */
  public async reclaimIdleCapabilities(): Promise<void> {
    console.log("[CapabilityGC] Reclaiming unused idle capabilities...");

    const allCaps = await this.registry.listCapabilities();
    const now = Date.now();

    for (const cap of allCaps) {
      if (cap.status !== "ACTIVE" && cap.status !== "READY" && cap.status !== "LOADED" && cap.status !== "IDLE") {
        continue;
      }

      // Read lastUsed timestamp
      if (cap.lastUsed) {
        const lastUsedMs = new Date(cap.lastUsed).getTime();
        const idleDurationMs = now - lastUsedMs;

        // Custom thresholds based on capability type
        let idleLimitMs = 10 * 60 * 1000; // 10 minutes default
        if (cap.type === "MCP") {
          idleLimitMs = 2 * 60 * 1000; // 2 minutes for MCP servers
        } else if (cap.type === "Runtime") {
          idleLimitMs = 5 * 60 * 1000; // 5 minutes for Python workers/containers
        } else if (cap.type === "Model") {
          idleLimitMs = 15 * 60 * 1000; // 15 minutes for LLM in VRAM
        }

        // If exceeded threshold, transition down
        if (idleDurationMs > idleLimitMs) {
          console.log(`[CapabilityGC] Capability ${cap.id} has been idle for ${(idleDurationMs / 1000).toFixed(1)}s (Limit: ${idleLimitMs / 1000}s). Reclaiming...`);
          
          // Soft suspend first, then unload
          if (cap.status === "ACTIVE" || cap.status === "READY") {
            await this.scheduler.transition(cap.id, "IDLE", "gc_idle_check");
          } else if (cap.status === "IDLE") {
            await this.scheduler.transition(cap.id, "SUSPENDED", "gc_idle_check");
            await this.scheduler.transition(cap.id, "UNLOADED", "gc_idle_check");
          }
        }
      }
    }
  }
}
export const capabilityGarbageCollector = CapabilityGarbageCollector.getInstance();
export default capabilityGarbageCollector;
