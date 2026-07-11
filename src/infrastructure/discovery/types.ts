export interface ProviderCapability {
  name: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface CapabilityReport {
  providerId: string;
  providerName: string;
  version: string;
  capabilities: ProviderCapability[];
  supportedOperations: string[];
  limitations: string[];
  dependencies: string[];
  authRequirements: "none" | "api-key" | "token" | "username-password" | "custom";
}

export interface IDiscoveryEnabled {
  getCapabilities(): Promise<CapabilityReport>;
}
