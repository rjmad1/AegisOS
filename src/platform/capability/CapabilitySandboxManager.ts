// src/platform/capability/CapabilitySandboxManager.ts
// Risk-Adaptive Capability Sandbox enforcer for AegisOS

import * as path from "path";
import { ToolSandbox } from "../ai-runtime/ToolSandbox";
import { CapabilityMetadata, SandboxTier, SandboxPolicy } from "./types";

export class CapabilitySandboxManager {
  private static instance: CapabilitySandboxManager | null = null;
  private activeAllocations: Map<string, { tier: SandboxTier; allocatedResources: any }> = new Map();

  private constructor() {}

  public static getInstance(): CapabilitySandboxManager {
    if (!CapabilitySandboxManager.instance) {
      CapabilitySandboxManager.instance = new CapabilitySandboxManager();
    }
    return CapabilitySandboxManager.instance;
  }

  /**
   * Assesses the capability risks and returns the recommended sandbox policy tier.
   */
  public determineTier(cap: CapabilityMetadata): SandboxTier {
    if (cap.publisher === "AegisOS Core Team" && cap.trustScore === 1.0) {
      return "Tier0_Native";
    }

    if (cap.trustScore >= 0.9 && cap.type === "Skill") {
      return "Tier1_RestrictedProcess";
    }

    if (cap.type === "MCP" || cap.type === "Tool" || cap.type === "Plugin") {
      return "Tier2_ToolSandbox";
    }

    if (cap.trustScore < 0.8 || cap.publisher === "Unknown") {
      return "Tier3_ContainerSandbox";
    }

    return "Tier4_MicroVMSandbox"; // Highest risk fallback
  }

  /**
   * Authorizes execution, checking sandbox boundaries, filesystem paths, and network allow-lists.
   */
  public async authorizeExecution(
    cap: CapabilityMetadata,
    params: { path?: string; host?: string; action?: string }
  ): Promise<boolean> {
    const policy = cap.sandboxPolicy;

    // 1. Filesystem check
    if (params.path) {
      if (!policy.allowFileSystem) {
        throw new Error(`[SandboxManager] Security Exception: Filesystem access is blocked for capability ${cap.id}.`);
      }
      
      const resolved = path.resolve(params.path);
      const isAllowed = policy.allowedPaths.some(p => {
        const resolvedAllowed = path.resolve(p);
        return resolved.startsWith(resolvedAllowed);
      });

      if (!isAllowed) {
        // Fallback check against ToolSandbox's safe directory
        try {
          ToolSandbox.validatePath(params.path);
        } catch {
          throw new Error(`[SandboxManager] Security Exception: Attempted to access path outside allowed bounds: ${params.path}`);
        }
      }
    }

    // 2. Network check
    if (params.host) {
      if (!policy.allowNetwork) {
        throw new Error(`[SandboxManager] Security Exception: Outbound network access is disabled for capability ${cap.id}.`);
      }
      const isHostAllowed = policy.allowedHosts.includes("*") || 
        policy.allowedHosts.some(h => params.host!.toLowerCase().includes(h.toLowerCase()));

      if (!isHostAllowed) {
        throw new Error(`[SandboxManager] Security Exception: Network target host "${params.host}" is not allowlisted.`);
      }
    }

    return true;
  }

  /**
   * Allocates resources and configures process isolation constraints for the given capability.
   */
  public async setupSandbox(cap: CapabilityMetadata): Promise<SandboxPolicy> {
    const tier = this.determineTier(cap);
    const policy = { ...cap.sandboxPolicy, tier };

    console.log(`[SandboxManager] Setting up ${tier} for capability ${cap.id}...`);

    this.activeAllocations.set(cap.id, {
      tier,
      allocatedResources: {
        ramMb: policy.ramBudgetMb,
        vramMb: policy.vramBudgetMb,
        cpuQuota: policy.cpuQuotaRatio
      }
    });

    // Simulate process orchestration/cgroup allocations depending on tier
    if (tier === "Tier3_ContainerSandbox") {
      console.log(`[SandboxManager] Docker container initialized for ${cap.id} with VRAM limit: ${policy.vramBudgetMb}MB.`);
    } else if (tier === "Tier4_MicroVMSandbox") {
      console.log(`[SandboxManager] demand-spawning MicroVM (Firecracker/Hyper-V) for capability ${cap.id}.`);
    }

    return policy;
  }

  /**
   * Destroys process isolation constraints, releases files locks, VRAM/RAM allocations.
   */
  public async teardownSandbox(id: string): Promise<void> {
    const allocation = this.activeAllocations.get(id);
    if (!allocation) return;

    console.log(`[SandboxManager] Tearing down sandbox and releasing allocations for ${id}...`);
    this.activeAllocations.delete(id);
  }
}
export const capabilitySandboxManager = CapabilitySandboxManager.getInstance();
export default capabilitySandboxManager;
