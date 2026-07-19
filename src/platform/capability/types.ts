// src/platform/capability/types.ts
// Core type definitions for the AegisOS Adaptive Capability Lifecycle Subsystem

import { TenantContext } from "../core/storage/types";

export type CapabilityType =
  | "MCP"
  | "Skill"
  | "Plugin"
  | "Runtime"
  | "Agent"
  | "Connector"
  | "Model"
  | "Tool"
  | "Service";

export type LifecycleState =
  | "DISCOVERED"
  | "VALIDATED"
  | "INSTALLED"
  | "LOADED"
  | "READY"
  | "ACTIVE"
  | "IDLE"
  | "WARM"
  | "SUSPENDED"
  | "HIBERNATED"
  | "UNLOADED"
  | "ARCHIVED"
  | "RETIRED";

export type SandboxTier =
  | "Tier0_Native"
  | "Tier1_RestrictedProcess"
  | "Tier2_ToolSandbox"
  | "Tier3_ContainerSandbox"
  | "Tier4_MicroVMSandbox";

export interface SandboxPolicy {
  tier: SandboxTier;
  allowNetwork: boolean;
  allowedHosts: string[];
  allowFileSystem: boolean;
  allowedPaths: string[];
  ramBudgetMb: number;
  vramBudgetMb: number;
  cpuQuotaRatio: number;
}

export interface CapabilityMetadata {
  id: string;
  name: string;
  type: CapabilityType;
  version: string;
  publisher: string;
  repository: string;
  signature?: string;
  trustScore: number;
  status: LifecycleState;
  installedAt: string;
  lastValidated?: string;
  lastUsed?: string;
  usageCount: number;
  averageLatencyMs: number;
  memoryProfileKb: number;
  cpuProfileRatio: number;
  gpuProfileMb: number;
  dependencyGraph: string[]; // IDs of other capabilities required
  compatibilityProfile: Record<string, any>;
  sandboxPolicy: SandboxPolicy;
  securityPolicy: Record<string, any>;
  healthScore: number;
  failureRate: number;
  successRate: number;
  retirementReason?: string;
}

export interface CapabilityEvent {
  id: string;
  capabilityId: string;
  timestamp: string;
  eventType: string; // e.g. "acquisition", "activation", "suspension", "unloading", "retirement"
  state: LifecycleState;
  durationMs: number;
  resourceUsage: {
    ramMb?: number;
    vramMb?: number;
    cpuRatio?: number;
  };
  trigger: string; // e.g. "workflow:wf-1", "user", "inactivity_gc"
  result: "success" | "failure";
  diagnostics?: string;
}

export interface TrustPolicy {
  allowedPublishers: string[];
  allowedRegistries: string[];
  allowedGithubOrgs: string[];
  minimumTrustScore: number;
  requireSignature: boolean;
  allowedLicenses: string[];
}

export interface ResourceProfile {
  availableRamMb: number;
  availableVramMb: number;
  cpuPressureRatio: number;
  diskPressureRatio: number;
  isBatteryPowered: boolean;
  thermalStatus: "nominal" | "fair" | "serious" | "critical";
}

export interface UtilityScore {
  score: number;
  usageFrequency: number;
  recencyWeight: number;
  predictedWeight: number;
  initializationPenalty: number;
  resourcePenalty: number;
}

export interface AssessmentResult {
  status: "Native" | "Cached" | "Acquirable" | "Impossible";
  reason: string;
  confidenceScore: number;
  capabilityId?: string;
  acquisitionCostEstimateUsd?: number;
  resourceImpact?: {
    ramMb: number;
    vramMb: number;
    startupMs: number;
  };
}

export interface ICapabilityRegistry {
  getCapability(id: string, context: TenantContext): Promise<CapabilityMetadata | null>;
  saveCapability(metadata: CapabilityMetadata, context: TenantContext): Promise<void>;
  listCapabilities(context: TenantContext, filters?: any): Promise<CapabilityMetadata[]>;
}

export interface ICapabilityScheduler {
  calculateUtility(capability: CapabilityMetadata, context: TenantContext): UtilityScore;
  prioritize(capabilities: CapabilityMetadata[], context: TenantContext): CapabilityMetadata[];
  transition(id: string, targetState: LifecycleState, trigger: string, context: TenantContext): Promise<void>;
}

export interface ICapabilityDiscovery {
  discover(intent: string, context: TenantContext): Promise<CapabilityMetadata[]>;
}

export interface ICapabilityTrustManager {
  validateTrust(metadata: CapabilityMetadata): Promise<boolean>;
}

export interface ICapabilitySandbox {
  applyPolicy(metadata: CapabilityMetadata): Promise<void>;
}

export interface ICapabilityOptimizer {
  optimize(profile: ResourceProfile): Promise<void>;
}

export interface ICapabilityTelemetry {
  recordEvent(event: CapabilityEvent, context: TenantContext): Promise<void>;
}

export interface ICapabilityLifecycle {
  assessCapability(intent: string, context: TenantContext): Promise<AssessmentResult>;
  acquireCapability(metadata: CapabilityMetadata, context: TenantContext): Promise<void>;
  assessAndAcquire(taskName: string, requiredCapabilities: string[], context?: TenantContext): Promise<Record<string, AssessmentResult>>;
  releaseCapability(capabilityId: string, success: boolean, durationMs: number, context?: TenantContext): Promise<void>;
}
