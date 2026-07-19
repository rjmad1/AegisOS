// src/platform/capability/CapabilityRegistry.ts
// Domain Registry management for AegisOS Capabilities

import { SQLiteCapabilityStore } from "./SQLiteCapabilityStore";
import { CapabilityMetadata, LifecycleState, CapabilityType } from "./types";

export class CapabilityRegistry {
  private static instance: CapabilityRegistry | null = null;
  private store: SQLiteCapabilityStore;
  private isInitialized = false;

  private constructor() {
    this.store = new SQLiteCapabilityStore();
  }

  public static getInstance(): CapabilityRegistry {
    if (!CapabilityRegistry.instance) {
      CapabilityRegistry.instance = new CapabilityRegistry();
    }
    return CapabilityRegistry.instance;
  }

  public async init(seedDefault = true): Promise<void> {
    if (this.isInitialized) return;
    await this.store.initialize();
    this.isInitialized = true;

    if (seedDefault) {
      await this.seedDefaultCapabilities();
    }
  }

  public getStore(): SQLiteCapabilityStore {
    return this.store;
  }

  public async getCapability(id: string): Promise<CapabilityMetadata | null> {
    await this.init();
    return this.store.getCapability(id);
  }

  public async saveCapability(metadata: CapabilityMetadata): Promise<void> {
    await this.init();
    
    // Semantic version validation
    if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      throw new Error(`[CapabilityRegistry] Invalid semantic version format: ${metadata.version}`);
    }

    // Verify dependency loops
    await this.verifyDependencyLoops(metadata.id, metadata.dependencyGraph);

    await this.store.saveCapability(metadata);
  }

  public async updateCapabilityState(id: string, state: LifecycleState): Promise<void> {
    const cap = await this.getCapability(id);
    if (!cap) {
      throw new Error(`[CapabilityRegistry] Capability ${id} not found.`);
    }
    cap.status = state;
    if (state === "ACTIVE") {
      cap.lastUsed = new Date().toISOString();
      cap.usageCount++;
    }
    await this.saveCapability(cap);
  }

  public async deleteCapability(id: string): Promise<boolean> {
    await this.init();
    return this.store.deleteCapability(id);
  }

  public async listCapabilities(filters?: { type?: CapabilityType; status?: LifecycleState }): Promise<CapabilityMetadata[]> {
    await this.init();
    return this.store.listCapabilities(filters);
  }

  // --- Seed Heuristics ---

  private async seedDefaultCapabilities(): Promise<void> {
    const list = await this.store.listCapabilities();
    if (list.length > 0) return; // Already seeded

    console.log("[CapabilityRegistry] Seeding default capabilities metadata...");

    const defaults: CapabilityMetadata[] = [
      {
        id: "cap:mcp:filesystem",
        name: "MCP Filesystem Server",
        type: "MCP",
        version: "1.0.0",
        publisher: "AegisOS Core Team",
        repository: "https://github.com/modelcontextprotocol/server-filesystem",
        signature: "a".repeat(64), // Simulated Cosign signature
        trustScore: 1.0,
        status: "UNLOADED",
        installedAt: new Date().toISOString(),
        usageCount: 0,
        averageLatencyMs: 45.0,
        memoryProfileKb: 32768,
        cpuProfileRatio: 0.02,
        gpuProfileMb: 0,
        dependencyGraph: [],
        compatibilityProfile: { os: "any", arch: "any" },
        sandboxPolicy: {
          tier: "Tier2_ToolSandbox",
          allowNetwork: false,
          allowedHosts: [],
          allowFileSystem: true,
          allowedPaths: ["D:/AegisOS/Data"],
          ramBudgetMb: 128,
          vramBudgetMb: 0,
          cpuQuotaRatio: 0.1
        },
        securityPolicy: { permissions: ["fs:read", "fs:write"] },
        healthScore: 1.0,
        failureRate: 0.0,
        successRate: 1.0
      },
      {
        id: "cap:skill:code-generation",
        name: "Software Engineering Skill",
        type: "Skill",
        version: "1.2.0",
        publisher: "AegisOS Core Team",
        repository: "https://github.com/aegisos/skills-core",
        signature: "b".repeat(64),
        trustScore: 0.98,
        status: "UNLOADED",
        installedAt: new Date().toISOString(),
        usageCount: 0,
        averageLatencyMs: 120.0,
        memoryProfileKb: 16384,
        cpuProfileRatio: 0.01,
        gpuProfileMb: 0,
        dependencyGraph: ["cap:mcp:filesystem"],
        compatibilityProfile: { os: "any", arch: "any" },
        sandboxPolicy: {
          tier: "Tier1_RestrictedProcess",
          allowNetwork: false,
          allowedHosts: [],
          allowFileSystem: true,
          allowedPaths: ["D:/AegisOS/Data"],
          ramBudgetMb: 64,
          vramBudgetMb: 0,
          cpuQuotaRatio: 0.05
        },
        securityPolicy: { permissions: ["execute_code"] },
        healthScore: 1.0,
        failureRate: 0.0,
        successRate: 1.0
      },
      {
        id: "cap:model:gemma2",
        name: "Gemma 2 9B Local Model",
        type: "Model",
        version: "2.0.0",
        publisher: "Google",
        repository: "https://huggingface.co/google/gemma-2-9b-it",
        signature: "c".repeat(64),
        trustScore: 1.0,
        status: "UNLOADED",
        installedAt: new Date().toISOString(),
        usageCount: 0,
        averageLatencyMs: 850.0,
        memoryProfileKb: 2097152, // 2GB host RAM
        cpuProfileRatio: 0.15,
        gpuProfileMb: 4608, // 4.5 GB VRAM
        dependencyGraph: [],
        compatibilityProfile: { minVramGb: 6.0, cuda: true },
        sandboxPolicy: {
          tier: "Tier0_Native",
          allowNetwork: false,
          allowedHosts: [],
          allowFileSystem: false,
          allowedPaths: [],
          ramBudgetMb: 4096,
          vramBudgetMb: 6144,
          cpuQuotaRatio: 0.8
        },
        securityPolicy: { permissions: ["gpu_access"] },
        healthScore: 1.0,
        failureRate: 0.0,
        successRate: 1.0
      }
    ];

    for (const d of defaults) {
      await this.store.saveCapability(d);
    }
  }

  // --- Dependency Loop Verification ---

  private async verifyDependencyLoops(id: string, dependencies: string[]): Promise<void> {
    const visited = new Set<string>();
    const stack = new Set<string>();

    const check = async (currId: string, deps: string[]) => {
      visited.add(currId);
      stack.add(currId);

      for (const depId of deps) {
        if (depId === id) {
          throw new Error(`[CapabilityRegistry] Circular dependency detected involving ${id} -> ${currId}`);
        }
        if (!visited.has(depId)) {
          const cap = await this.getCapability(depId);
          if (cap) {
            await check(depId, cap.dependencyGraph);
          }
        } else if (stack.has(depId)) {
          throw new Error(`[CapabilityRegistry] Circular dependency loop detected involving ${currId} -> ${depId}`);
        }
      }
      stack.delete(currId);
    };

    await check(id, dependencies);
  }
}
export const capabilityRegistry = CapabilityRegistry.getInstance();
export default capabilityRegistry;
