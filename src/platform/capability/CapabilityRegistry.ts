import { ICapabilityRegistry, CapabilityMetadata, CapabilityType } from "./types";
import { ICapabilityStorageProvider, TenantContext } from "../core/storage/types";
import * as fs from "fs";
import * as path from "path";

export interface CapabilityPluginManifest {
  id: string;
  name: string;
  version: string;
  manifestVersion: string;
  capabilities: string[];
  dependencies: Record<string, string>;
  configSchema: any;
  permissions: string[];
  lifecycleHooks?: {
    onInitialize?: string;
    onShutdown?: string;
  };
}

export class CapabilityRegistry implements ICapabilityRegistry {
  private plugins: Map<string, CapabilityPluginManifest> = new Map();
  private manifestDir: string;

  constructor(private storageProvider: ICapabilityStorageProvider) {
    this.manifestDir = path.resolve(process.cwd(), "configs", "plugins");
    this.ensureDirs();
  }

  private ensureDirs() {
    if (!fs.existsSync(this.manifestDir)) {
      fs.mkdirSync(this.manifestDir, { recursive: true });
    }
  }

  public registerPlugin(manifest: CapabilityPluginManifest): void {
    this.plugins.set(manifest.id, manifest);
    const targetPath = path.join(this.manifestDir, `${manifest.id}.json`);
    try {
      fs.writeFileSync(targetPath, JSON.stringify(manifest, null, 2), "utf-8");
      console.log(`[CapabilityRegistry] Registered discoverable plugin: ${manifest.name} (${manifest.id})`);
    } catch (err) {
      console.error(`[CapabilityRegistry] Failed to save manifest for ${manifest.id}:`, err);
    }
  }

  public getPlugin(id: string): CapabilityPluginManifest | null {
    return this.plugins.get(id) || null;
  }

  public listPlugins(): CapabilityPluginManifest[] {
    return Array.from(this.plugins.values());
  }

  public queryCapability(capabilityName: string): CapabilityPluginManifest[] {
    return this.listPlugins().filter((p) => p.capabilities.includes(capabilityName));
  }

  public async getCapability(id: string, context: TenantContext): Promise<CapabilityMetadata | null> {
    return this.storageProvider.getCapability(id, context);
  }

  public async saveCapability(metadata: CapabilityMetadata, context: TenantContext): Promise<void> {
    if (!/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      throw new Error(`[CapabilityRegistry] Invalid semantic version format: ${metadata.version}`);
    }

    await this.verifyDependencyLoops(metadata.id, metadata.dependencyGraph, context);

    await this.storageProvider.saveCapability(metadata, context);
  }

  public async listCapabilities(context: TenantContext, filters?: { type?: CapabilityType; status?: any }): Promise<CapabilityMetadata[]> {
    let caps = await this.storageProvider.listCapabilities(context);
    
    if (filters) {
      if (filters.type) caps = caps.filter(c => c.type === filters.type);
      if (filters.status) caps = caps.filter(c => c.status === filters.status);
    }
    return caps;
  }

  private async verifyDependencyLoops(id: string, dependencies: string[], context: TenantContext): Promise<void> {
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
          const cap = await this.getCapability(depId, context);
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

  public async seedDefaultCapabilities(context: TenantContext): Promise<void> {
    const list = await this.storageProvider.listCapabilities(context);
    if (list.length > 0) return;

    console.log("[CapabilityRegistry] Seeding default capabilities metadata...");

    const defaults: CapabilityMetadata[] = [
      {
        id: "cap:mcp:filesystem",
        name: "MCP Filesystem Server",
        type: "MCP",
        version: "1.0.0",
        publisher: "AegisOS Core Team",
        repository: "https://github.com/modelcontextprotocol/server-filesystem",
        signature: "a".repeat(64),
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
        memoryProfileKb: 2097152,
        cpuProfileRatio: 0.15,
        gpuProfileMb: 4608,
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
      await this.storageProvider.saveCapability(d, context);
    }
  }
}
