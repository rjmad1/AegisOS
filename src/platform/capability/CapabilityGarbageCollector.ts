// src/platform/capability/CapabilityGarbageCollector.ts
// Background resource collector for AegisOS Capabilities

import { ICapabilityRegistry, ICapabilityScheduler } from "./types";
import { TenantContext } from "../core/storage/types";

export class CapabilityGarbageCollector {
  constructor(
    private registry: ICapabilityRegistry,
    private scheduler: ICapabilityScheduler
  ) {}

  /**
   * Identifies idle capabilities and unloads them from resident RAM/VRAM.
   */
  public async reclaimIdleCapabilities(context: TenantContext): Promise<void> {
    console.log("[CapabilityGC] Reclaiming unused idle capabilities...");

    const allCaps = await this.registry.listCapabilities(context);
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
            await this.scheduler.transition(cap.id, "IDLE", "gc_idle_check", context);
          } else if (cap.status === "IDLE") {
            await this.scheduler.transition(cap.id, "SUSPENDED", "gc_idle_check", context);
            await this.scheduler.transition(cap.id, "UNLOADED", "gc_idle_check", context);
          }
        }
      }
    }
  }
}
