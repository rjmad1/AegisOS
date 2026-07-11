export type ProviderType =
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
  | "environment-provider";

export interface IInfrastructureProvider {
  id: string;
  name: string;
  type: ProviderType;
  initialize(config: Record<string, any>): Promise<void>;
  shutdown(): Promise<void>;
}
