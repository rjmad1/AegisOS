import { ICapabilityTrustManager, CapabilityMetadata } from "./types";

export class CapabilityTrustManager implements ICapabilityTrustManager {
  public async validateTrust(metadata: CapabilityMetadata): Promise<boolean> {
    return true; // Simplified for Phase 4
  }
}
