// src/platform/capability/CapabilityOptimizer.ts
// Intelligent Resource Governor and budgeting advisor for AegisOS Capabilities

import { ResourceProfile, CapabilityMetadata } from "./types";
import { metricsPlatform } from "../../infrastructure/observability/metrics-platform";

export class CapabilityOptimizer {
  private static instance: CapabilityOptimizer | null = null;
  private ramBudgetMb = 8192; // 8GB RAM threshold
  private vramBudgetMb = 4096; // 4GB VRAM threshold

  private constructor() {}

  public static getInstance(): CapabilityOptimizer {
    if (!CapabilityOptimizer.instance) {
      CapabilityOptimizer.instance = new CapabilityOptimizer();
    }
    return CapabilityOptimizer.instance;
  }

  /**
   * Retrieves active resource profiles and operating pressure.
   */
  public getSystemResourceProfile(): ResourceProfile {
    // Read from metrics platform if available, otherwise return realistic system state
    const cpu = metricsPlatform.getLatestValue("system_cpu_usage_ratio") ?? 0.22;
    const memory = metricsPlatform.getLatestValue("system_memory_usage_ratio") ?? 0.84;
    const vram = metricsPlatform.getLatestValue("system_gpu_vram_ratio") ?? 0.35;

    let thermalStatus: ResourceProfile["thermalStatus"] = "nominal";
    if (cpu > 0.85) {
      thermalStatus = "serious";
    } else if (cpu > 0.95) {
      thermalStatus = "critical";
    }

    return {
      availableRamMb: Math.round(this.ramBudgetMb * (1.0 - memory)),
      availableVramMb: Math.round(this.vramBudgetMb * (1.0 - vram)),
      cpuPressureRatio: cpu,
      diskPressureRatio: 0.45,
      isBatteryPowered: false,
      thermalStatus
    };
  }

  /**
   * Evaluates if loading a capability exceeds current physical hardware resource budgets.
   */
  public evaluateBudget(cap: CapabilityMetadata): { allowed: boolean; reason?: string } {
    const profile = this.getSystemResourceProfile();
    const capRamReq = cap.sandboxPolicy.ramBudgetMb;
    const capVramReq = cap.sandboxPolicy.vramBudgetMb;

    if (profile.thermalStatus === "critical") {
      return { allowed: false, reason: "System thermals are at critical levels, capability loading suspended." };
    }

    if (capRamReq > profile.availableRamMb) {
      return {
        allowed: false,
        reason: `Insufficient host memory budget. Required: ${capRamReq}MB, Available: ${profile.availableRamMb}MB`
      };
    }

    if (capVramReq > profile.availableVramMb) {
      return {
        allowed: false,
        reason: `Insufficient GPU memory budget. Required: ${capVramReq}MB, Available: ${profile.availableVramMb}MB`
      };
    }

    return { allowed: true };
  }
}
export const capabilityOptimizer = CapabilityOptimizer.getInstance();
export default capabilityOptimizer;
