// src/platform/developer/types.ts

export type ExtensionState = 'loaded' | 'unloaded' | 'degraded' | 'suspended';

export interface DeveloperExtensionPoint {
  id: string;
  name: string;
  description?: string;
  schema?: any;
  version: string;
}

export interface SandboxPolicy {
  allowNetwork: boolean;
  allowedHosts: string[];
  allowFileSystem: boolean;
  allowedPaths: string[];
  maxMemoryMb?: number;
  cpuLimit?: number;
}

export interface DeveloperExtension<T = any> {
  pointId: string;
  extensionId: string;
  version: string;
  implementation: T;
  priority?: number;
  metadata?: Record<string, any>;
  state: ExtensionState;
  sandboxPolicy?: SandboxPolicy;
}

export interface DeveloperPlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author: string;
  type: string;
  permissions: string[];
  signature: string;
  status: 'active' | 'inactive' | 'error';
  telemetryEnabled: boolean;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  version: string;
  type: 'agent' | 'prompt' | 'tool' | 'workflow' | 'template' | 'knowledge-pack' | 'skill' | 'extension' | 'plugin' | 'dashboard' | 'policy' | 'theme';
  description: string;
  author: string;
  license: string;
  pricingType: 'free' | 'subscription' | 'metered';
  price?: number;
  ratingsCount: number;
  ratingsAverage: number;
  reviews: MarketplaceReview[];
  dependencies: Record<string, string>;
  signature: string;
  isVerified: boolean;
  downloadCount: number;
  metadata: Record<string, any>;
}

export interface MarketplaceReview {
  id: string;
  userId: string;
  userEmail: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface CertificationResult {
  passed: boolean;
  score: number; // 0 to 100
  timestamp: string;
  issues: string[];
  sandboxValid: boolean;
  apiCompatible: boolean;
  signatureVerified: boolean;
  dependencyChecked: boolean;
}

export interface LicenseEntitlement {
  tenantId: string;
  licenseKey: string;
  tier: 'developer' | 'team' | 'enterprise';
  status: 'active' | 'expired' | 'suspended';
  expiresAt: string;
  features: string[];
  usageLimits: Record<string, number>;
}

export interface UsageMetric {
  id: string;
  tenantId: string;
  itemId: string;
  metricName: string;
  quantity: number;
  timestamp: string;
}

export interface PlatformAnalytics {
  apiCalls: number;
  errorRate: number;
  latencyAverageMs: number;
  activeExtensions: number;
  activePlugins: number;
  activeAgents: number;
  licensingCharges: number;
}
