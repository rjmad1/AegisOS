export type ProviderType =
  // Infrastructure Providers
  | "artifact-provider"
  | "model-provider"
  | "runtime-provider"
  | "knowledge-provider"
  | "log-provider"
  | "file-provider"
  | "hardware-provider"
  | "configuration-provider"
  | "workflow-provider"
  | "job-provider"
  | "ai-runtime-provider"
  | "os-provider"
  | "cpu-provider"
  | "memory-provider"
  | "disk-provider"
  | "filesystem-provider"
  | "network-provider"
  | "process-provider"
  | "gpu-provider"
  | "container-provider"
  | "database-provider"
  | "service-provider"
  | "power-provider"
  | "environment-provider"
  | "workspace-provider"
  | "execution-provider"
  | "executor-provider"
  | "execution-stream-provider"
  | "merge-provider"
  // Platform/Mission Providers
  | "discovery"
  | "simulation"
  | "qualification"
  | "reasoning"
  | "planning"
  | "governance"
  | "memory"
  | "optimization"
  | "recommendation"
  | "mission";

export interface IProvider {
  id: string;
  name: string;
  type: ProviderType;
  dependencies?: string[];
  initialize?(config?: Record<string, any>): Promise<void>;
  shutdown?(): Promise<void>;
}

// Keep backward compatibility for now
export type IInfrastructureProvider = IProvider;
export type IPlatformProvider = IProvider;
