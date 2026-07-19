// src/platform/capability/CapabilityDiscoveryService.ts
// Service for dynamic capability discovery and packaging validation

import { CapabilityMetadata, AssessmentResult } from "./types";
import { CapabilityRegistry } from "./CapabilityRegistry";
import { CapabilityTrustManager } from "./CapabilityTrustManager";

export class CapabilityDiscoveryService {
  private static instance: CapabilityDiscoveryService | null = null;
  private registry: CapabilityRegistry;
  private trustManager: CapabilityTrustManager;

  private constructor() {
    this.registry = CapabilityRegistry.getInstance();
    this.trustManager = CapabilityTrustManager.getInstance();
  }

  public static getInstance(): CapabilityDiscoveryService {
    if (!CapabilityDiscoveryService.instance) {
      CapabilityDiscoveryService.instance = new CapabilityDiscoveryService();
    }
    return CapabilityDiscoveryService.instance;
  }

  /**
   * Assesses required capabilities for a task, returning a mapping of statuses.
   */
  public async assessTaskRequirements(
    requiredCapabilities: string[]
  ): Promise<Record<string, AssessmentResult>> {
    const results: Record<string, AssessmentResult> = {};

    for (const capId of requiredCapabilities) {
      const cap = await this.registry.getCapability(capId);
      
      if (!cap) {
        // Gap exists: check if we can discover it
        const discovered = await this.discoverCapability(capId);
        if (discovered) {
          results[capId] = {
            status: "Acquirable",
            reason: `Capability found in remote registry ${discovered.repository}`,
            confidenceScore: discovered.trustScore,
            capabilityId: capId,
            acquisitionCostEstimateUsd: 0.005,
            resourceImpact: {
              ramMb: discovered.sandboxPolicy.ramBudgetMb,
              vramMb: discovered.sandboxPolicy.vramBudgetMb,
              startupMs: discovered.averageLatencyMs * 2
            }
          };
        } else {
          results[capId] = {
            status: "Impossible",
            reason: `Capability not found in any trusted catalogs or registries.`,
            confidenceScore: 0.0
          };
        }
      } else {
        // Exists in registry
        if (cap.status === "ACTIVE" || cap.status === "READY" || cap.status === "LOADED") {
          results[capId] = {
            status: "Native",
            reason: `Capability is currently loaded and available in phase ${cap.status}`,
            confidenceScore: cap.trustScore,
            capabilityId: capId
          };
        } else {
          results[capId] = {
            status: "Cached",
            reason: `Capability is registered but currently in state ${cap.status}`,
            confidenceScore: cap.trustScore,
            capabilityId: capId
          };
        }
      }
    }

    return results;
  }

  /**
   * Discovers and retrieves capability details from external trusted sources.
   */
  public async discoverCapability(id: string): Promise<CapabilityMetadata | null> {
    console.log(`[CapabilityDiscovery] Searching trusted catalogs for capability: ${id}...`);

    // Simulated remote catalogs matching common extensions or servers
    const remoteCatalogs: Record<string, Omit<CapabilityMetadata, "installedAt" | "status" | "usageCount">> = {
      "cap:mcp:postgres": {
        id: "cap:mcp:postgres",
        name: "MCP PostgreSQL Server",
        type: "MCP",
        version: "1.0.1",
        publisher: "Model Context Protocol Authors",
        repository: "https://github.com/modelcontextprotocol/server-postgres",
        signature: "e".repeat(64),
        trustScore: 0.95,
        averageLatencyMs: 80.0,
        memoryProfileKb: 49152,
        cpuProfileRatio: 0.03,
        gpuProfileMb: 0,
        dependencyGraph: [],
        compatibilityProfile: { os: "any", arch: "any" },
        sandboxPolicy: {
          tier: "Tier2_ToolSandbox",
          allowNetwork: true,
          allowedHosts: ["localhost", "127.0.0.1"],
          allowFileSystem: false,
          allowedPaths: [],
          ramBudgetMb: 128,
          vramBudgetMb: 0,
          cpuQuotaRatio: 0.1
        },
        securityPolicy: { permissions: ["network:outbound", "db_access"] },
        healthScore: 1.0,
        failureRate: 0.0,
        successRate: 0.99
      },
      "cap:mcp:brave-search": {
        id: "cap:mcp:brave-search",
        name: "MCP Brave Search Server",
        type: "MCP",
        version: "1.0.0",
        publisher: "Model Context Protocol Authors",
        repository: "https://github.com/modelcontextprotocol/server-brave-search",
        signature: "f".repeat(64),
        trustScore: 0.92,
        averageLatencyMs: 150.0,
        memoryProfileKb: 32768,
        cpuProfileRatio: 0.01,
        gpuProfileMb: 0,
        dependencyGraph: [],
        compatibilityProfile: { os: "any", arch: "any" },
        sandboxPolicy: {
          tier: "Tier2_ToolSandbox",
          allowNetwork: true,
          allowedHosts: ["api.search.brave.com"],
          allowFileSystem: false,
          allowedPaths: [],
          ramBudgetMb: 64,
          vramBudgetMb: 0,
          cpuQuotaRatio: 0.05
        },
        securityPolicy: { permissions: ["network:outbound"] },
        healthScore: 1.0,
        failureRate: 0.0,
        successRate: 0.97
      }
    };

    const match = remoteCatalogs[id];
    if (!match) return null;

    // Check with TrustManager
    const tempCap: CapabilityMetadata = {
      ...match,
      installedAt: new Date().toISOString(),
      status: "DISCOVERED",
      usageCount: 0
    };

    const validation = await this.trustManager.validate(tempCap);
    if (!validation.valid) {
      console.warn(`[CapabilityDiscovery] Trust check failed for ${id}: ${validation.reason}`);
      return null;
    }

    return tempCap;
  }

  /**
   * Installs and saves a discovered capability into the registry.
   */
  public async acquireCapability(id: string): Promise<CapabilityMetadata> {
    const discovered = await this.discoverCapability(id);
    if (!discovered) {
      throw new Error(`[CapabilityDiscovery] Failed to acquire capability ${id}. Discovery check returned empty or untrusted.`);
    }

    const metadata: CapabilityMetadata = {
      ...discovered,
      status: "INSTALLED",
      installedAt: new Date().toISOString()
    };

    await this.registry.saveCapability(metadata);
    console.log(`[CapabilityDiscovery] Successfully acquired and registered capability ${id}`);
    return metadata;
  }
}
export const capabilityDiscoveryService = CapabilityDiscoveryService.getInstance();
export default capabilityDiscoveryService;
