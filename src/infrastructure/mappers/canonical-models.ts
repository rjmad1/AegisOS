export interface PlatformModel {
  id: string;
  name: string;
  version: string;
  sizeBytes: number;
  parameterCount: string;
  quantization: string;
  status: "active" | "inactive" | "downloading" | "failed";
  capabilities: string[];
}

export interface PlatformArtifact {
  id: string;
  name: string;
  type: string;
  sizeBytes: number;
  uri: string;
  checksum?: string;
  createdDate: string;
  status: "active" | "archived" | "deleted";
}

export interface PlatformHardware {
  cpuUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  gpuUsagePercent?: number;
  gpuVramUsedBytes?: number;
  gpuVramTotalBytes?: number;
  temperatureC?: number;
}

export interface PlatformLog {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  service: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface PlatformService {
  id: string;
  name: string;
  status: "running" | "stopped" | "degraded" | "error";
  version: string;
  uptimeSeconds?: number;
}

export interface PlatformJob {
  id: string;
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progressPercent: number;
  errorMessage?: string;
  queuedAt: string;
}

export interface PlatformKnowledge {
  id: string;
  title: string;
  sourceUri: string;
  snippet?: string;
  relevanceScore: number;
}

export interface PlatformFile {
  name: string;
  path: string;
  isDirectory: boolean;
  sizeBytes: number;
  modifiedDate: string;
}
