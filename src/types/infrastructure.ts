// ============================================================================
// Canonical Infrastructure Models — Phase 7
// ============================================================================

export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface Temperature {
  current: number;
  max?: number;
  status: "normal" | "warning" | "critical";
}

export interface Fan {
  speedRpm: number;
  percent?: number;
}

export interface Sensor {
  name: string;
  type: "temperature" | "voltage" | "fan" | "power";
  value: number;
  unit: string;
}

export interface PowerStatus {
  status: "ac" | "battery";
  percent?: number;
  remainingMinutes?: number;
  usageWatts?: number;
}

export interface OperatingSystem {
  platform: string; // e.g. "win32", "linux"
  release: string; // e.g. "10.0.22631"
  version: string; // e.g. "Windows 11 Pro"
  arch: string; // e.g. "x64"
  kernelVersion: string;
  hostname: string;
  uptime: number;
}

export interface CPUCore {
  id: number;
  model: string;
  speed: number; // MHz
  load: number; // percentage
}

export interface CPU {
  manufacturer: string;
  brand: string;
  speed: number; // GHz
  cores: number;
  logicalProcessors: number;
  load: number; // overall usage percentage
  coresList: CPUCore[];
  temperature?: Temperature;
}

export interface Memory {
  total: number; // bytes
  free: number; // bytes
  used: number; // bytes
  active?: number;
  swapTotal: number;
  swapUsed: number;
  swapFree: number;
}

export interface Partition {
  name: string; // e.g. "C:" or "/dev/sda1"
  mountPoint: string; // e.g. "C:\" or "/"
  filesystem: string; // e.g. "NTFS", "ext4"
  size: number; // bytes
  used: number;
  free: number;
  healthStatus: HealthStatus;
}

export interface Disk {
  name: string;
  model: string;
  interfaceType: string; // SSD, NVMe, HDD
  size: number; // bytes
  healthStatus: HealthStatus;
  smartStatus: string; // e.g. "OK", "FAILING"
  partitions: Partition[];
}

export interface Filesystem {
  path: string;
  type: string;
  size: number;
  used: number;
  free: number;
  usagePercentage: number;
}

export interface VRAM {
  total: number; // bytes
  free: number;
  used: number;
}

export interface GPUDevice {
  id: string;
  name: string;
  vendor: string; // e.g. "NVIDIA"
  driver: string;
  vram: VRAM;
  temperature: Temperature;
  powerUsage: PowerStatus;
  fanSpeed: Fan;
  utilization: number; // overall core load
  memoryUsage: number; // percentage VRAM used
  runningProcesses: string[]; // List of process names/PIDs using GPU
  assignedModels: string[]; // List of AI model names active on VRAM
  inferenceUtilization: number; // inference load
  pcieInfo: string;
}

export interface GPU {
  vendor: string;
  driver: string;
  cudaVersion?: string;
  rocmVersion?: string;
  devices: GPUDevice[];
}

export interface TrafficStats {
  rxBytes: number;
  txBytes: number;
  rxPackets?: number;
  txPackets?: number;
  errors?: number;
}

export interface NetworkInterface {
  name: string;
  mac: string;
  ip4: string;
  ip6: string;
  internal: boolean;
  speed?: number; // Mbps
  traffic: TrafficStats;
}

export interface NetworkConnection {
  protocol: "tcp" | "udp" | string;
  localAddress: string;
  localPort: number;
  foreignAddress: string;
  foreignPort: number;
  state?: string; // e.g. "LISTENING", "ESTABLISHED"
  processId?: number;
  processName?: string;
}

export interface Process {
  pid: number;
  ppid: number;
  name: string;
  cpuUsage: number; // percentage
  memoryUsage: number; // percentage
  memoryBytes: number; // bytes
  threads: number;
  handles?: number;
  childProcesses: number[];
  parentProcessId: number | null;
  openPorts: number[];
  associatedServices: string[];
  executablePath: string;
  restartCount?: number;
}

export interface Service {
  name: string;
  displayName: string;
  status: "running" | "stopped" | "degraded";
  startType: "automatic" | "manual" | "disabled" | string;
  processId?: number;
  executablePath?: string;
  description?: string;
}

export interface Container {
  id: string;
  name: string;
  status: string; // "running", "paused", "stopped"
  image: string;
  volumes: string[];
  networks: string[];
  resourceConsumption: {
    cpu: number; // percentage
    memory: number; // bytes
  };
  logsMetadata?: {
    lastLogTime: string;
    logLinesCount: number;
  };
}

export interface Database {
  type: "sqlite" | "postgres" | "redis" | "chroma" | "qdrant" | string;
  version: string;
  health: HealthStatus;
  sizeBytes: number;
  connectionCount: number;
  location: string;
  storagePath: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSystem: boolean;
}

export interface FilesystemUsage {
  mountPoint: string;
  sizeBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercent: number;
}

export interface StorageVolume {
  id: string;
  name: string;
  capacityBytes: number;
  freeBytes: number;
  type: "nvme" | "ssd" | "hdd" | "usb" | "network" | string;
  status: string;
}

export interface Host {
  id: string;
  hostname: string;
  operatingSystem: OperatingSystem;
  cpu: CPU;
  memory: Memory;
  installedStorage: StorageVolume[];
  mountedVolumes: FilesystemUsage[];
  environment: EnvironmentVariable[];
  networkInterfaces: NetworkInterface[];
  uptime: number;
  timezone: string;
  locale: string;
  powerStatus?: PowerStatus;
  healthStatus: HealthStatus;
}

export interface PerformanceSnapshot {
  timestamp: number;
  cpuLoad: number;
  memoryUsagePercent: number;
  diskIops: number;
  networkThroughput: {
    rx: number; // bytes/sec
    tx: number; // bytes/sec
  };
  gpuLoad?: number;
}

export interface HistoricalMetric {
  name: string;
  unit: string;
  timestamps: number[];
  values: number[];
}

export interface Threshold {
  id: string;
  metricName: string;
  warningLimit: number;
  criticalLimit: number;
  direction: "above" | "below";
}

export interface Alert {
  id: string;
  entityId: string;
  entityType: "host" | "cpu" | "memory" | "gpu" | "storage" | "network" | "process" | "service" | "database" | "container";
  severity: "warning" | "critical" | "info";
  message: string;
  timestamp: number;
  thresholdId?: string;
}
