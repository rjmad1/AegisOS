import { CapabilityMetadata, AssessmentResult, ICapabilityDiscovery, ICapabilityRegistry, ICapabilityTrustManager } from "./types";
import { TenantContext } from "../core/storage/types";

export class CapabilityDiscoveryService implements ICapabilityDiscovery {
  constructor(
    private registry: ICapabilityRegistry,
    private trustManager: ICapabilityTrustManager
  ) {}

  public async discover(intent: string, context: TenantContext): Promise<CapabilityMetadata[]> {
    // Stub for phase 4 modularization
    return [];
  }

  public async assessTaskRequirements(requiredCapabilities: string[], context: TenantContext): Promise<Record<string, AssessmentResult>> {
    const results: Record<string, AssessmentResult> = {};
    for (const capId of requiredCapabilities) {
      const cap = await this.registry.getCapability(capId, context);
      if (!cap) {
        results[capId] = { status: "Impossible", reason: "Not found", confidenceScore: 0.0 };
      } else {
        results[capId] = { status: "Native", reason: "Loaded", confidenceScore: cap.trustScore, capabilityId: capId };
      }
    }
    return results;
  }
}
