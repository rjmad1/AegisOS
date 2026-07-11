// ============================================================================
// Infrastructure Observability Service — Server Aggregator & Cache
// ============================================================================

import { ProviderRegistry } from "../infrastructure/providers/registry";
import { eventBus } from "../infrastructure/events/event-bus";
import {
  OperatingSystemProvider,
  CpuProvider,
  MemoryProvider,
  DiskProvider,
  FilesystemProvider as InfraFilesystemProvider,
  NetworkProvider,
  ProcessProvider,
  GpuProvider,
  ContainerProvider,
  DatabaseProvider,
  ServiceProvider,
  PowerProvider,
  EnvironmentProvider
} from "../infrastructure/providers/infrastructure-providers";
import {
  Host,
  CPU,
  Memory,
  Disk,
  Filesystem,
  NetworkInterface,
  NetworkConnection,
  Process,
  GPU,
  Container,
  Database,
  Service,
  PowerStatus,
  EnvironmentVariable,
  PerformanceSnapshot,
  Alert,
  Threshold,
  StorageVolume,
  FilesystemUsage
} from "@/types/infrastructure";

export class InfrastructureService {
  private static instance: InfrastructureService | null = null;
  
  private registry = ProviderRegistry.getInstance();
  private performanceHistory: PerformanceSnapshot[] = [];
  private activeAlerts: Alert[] = [];
  
  // Static thresholds configuration
  private thresholds: Threshold[] = [
    { id: "thresh-cpu-warn", metricName: "cpu_load", warningLimit: 80, criticalLimit: 95, direction: "above" },
    { id: "thresh-mem-warn", metricName: "mem_usage", warningLimit: 85, criticalLimit: 95, direction: "above" },
    { id: "thresh-disk-warn", metricName: "disk_usage", warningLimit: 90, criticalLimit: 98, direction: "above" }
  ];

  // Telemetry cache
  private cache: Record<string, { data: any; expiry: number }> = {};
  private cacheDurationMs = 3000; // 3 seconds cache

  private constructor() {
    this.startBackgroundMonitoring();
  }

  public static getInstance(): InfrastructureService {
    if (!InfrastructureService.instance) {
      InfrastructureService.instance = new InfrastructureService();
    }
    return InfrastructureService.instance;
  }

  // Generic Cache Wrapper
  private async getCached<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    if (this.cache[key] && this.cache[key].expiry > now) {
      return this.cache[key].data as T;
    }
    const data = await fetchFn();
    this.cache[key] = {
      data,
      expiry: now + this.cacheDurationMs
    };
    return data;
  }

  // --- Getters for Individual Components (Step 10 APIs) ---

  public async getOperatingSystem(): Promise<any> {
    const provider = this.getOrCreateProvider<OperatingSystemProvider>("os-provider");
    return this.getCached("os", () => provider.getOperatingSystem());
  }

  public async getCpu(): Promise<CPU> {
    const provider = this.getOrCreateProvider<CpuProvider>("cpu-provider");
    return this.getCached("cpu", () => provider.getCpu());
  }

  public async getMemory(): Promise<Memory> {
    const provider = this.getOrCreateProvider<MemoryProvider>("memory-provider");
    return this.getCached("memory", () => provider.getMemory());
  }

  public async getDisks(): Promise<Disk[]> {
    const provider = this.getOrCreateProvider<DiskProvider>("disk-provider");
    return this.getCached("disks", () => provider.getDisks());
  }

  public async getFilesystems(): Promise<Filesystem[]> {
    const provider = this.getOrCreateProvider<InfraFilesystemProvider>("filesystem-observability-provider");
    return this.getCached("filesystems", () => provider.getFilesystems());
  }

  public async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    const provider = this.getOrCreateProvider<NetworkProvider>("network-provider");
    return this.getCached("net-interfaces", () => provider.getInterfaces());
  }

  public async getNetworkConnections(): Promise<NetworkConnection[]> {
    const provider = this.getOrCreateProvider<NetworkProvider>("network-provider");
    return this.getCached("net-connections", () => provider.getConnections());
  }

  public async getProcesses(options?: any): Promise<{ processes: Process[]; total: number }> {
    const provider = this.getOrCreateProvider<ProcessProvider>("process-provider");
    // Processes list is large; we let the provider handle sorting, paging, filtering
    return provider.getProcesses(options);
  }

  public async getGpu(): Promise<GPU> {
    const provider = this.getOrCreateProvider<GpuProvider>("gpu-provider");
    return this.getCached("gpu", () => provider.getGpu());
  }

  public async getContainers(): Promise<Container[]> {
    const provider = this.getOrCreateProvider<ContainerProvider>("container-provider");
    return this.getCached("containers", () => provider.getContainers());
  }

  public async getDatabases(): Promise<Database[]> {
    const provider = this.getOrCreateProvider<DatabaseProvider>("database-provider");
    return this.getCached("databases", () => provider.getDatabases());
  }

  public async getServices(): Promise<Service[]> {
    const provider = this.getOrCreateProvider<ServiceProvider>("service-provider");
    return this.getCached("services", () => provider.getServices());
  }

  public async getPower(): Promise<PowerStatus> {
    const provider = this.getOrCreateProvider<PowerProvider>("power-provider");
    return this.getCached("power", () => provider.getPowerStatus());
  }

  public async getEnvironment(): Promise<EnvironmentVariable[]> {
    const provider = this.getOrCreateProvider<EnvironmentProvider>("environment-provider");
    return this.getCached("environment", () => provider.getEnvironmentVariables());
  }

  // --- Aggregate Host Discovery (Step 3) ---

  public async getHost(): Promise<Host> {
    const osData = await this.getOperatingSystem();
    const cpuData = await this.getCpu();
    const memData = await this.getMemory();
    const diskData = await this.getDisks();
    const filesystems = await this.getFilesystems();
    const netInterfaces = await this.getNetworkInterfaces();
    const envVars = await this.getEnvironment();
    const power = await this.getPower();

    const installedStorage: StorageVolume[] = diskData.map((d, index) => ({
      id: `storage-disk-${index}`,
      name: d.name,
      capacityBytes: d.size,
      freeBytes: d.partitions.reduce((sum, p) => sum + p.free, 0),
      type: d.interfaceType.toLowerCase(),
      status: d.healthStatus
    }));

    const mountedVolumes: FilesystemUsage[] = filesystems.map(f => ({
      mountPoint: f.path,
      sizeBytes: f.size,
      usedBytes: f.used,
      freeBytes: f.free,
      usagePercent: f.usagePercentage
    }));

    // Health calculations
    const isCpuDegraded = cpuData.load > 85;
    const isMemDegraded = (memData.used / memData.total) * 100 > 85;
    const isStorageDegraded = mountedVolumes.some(v => v.usagePercent > 90);
    const healthStatus = (isCpuDegraded || isMemDegraded || isStorageDegraded) ? "degraded" : "healthy";

    return {
      id: "host-workstation-0",
      hostname: osData.hostname,
      operatingSystem: osData,
      cpu: cpuData,
      memory: memData,
      installedStorage,
      mountedVolumes,
      environment: envVars,
      networkInterfaces: netInterfaces,
      uptime: osData.uptime,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
      powerStatus: power,
      healthStatus
    };
  }

  // --- Performance snapshots history (Step 14) ---

  public getPerformanceHistory(): PerformanceSnapshot[] {
    return [...this.performanceHistory];
  }

  // --- Alerting & Thresholds (Step 13) ---

  public getAlerts(): Alert[] {
    return [...this.activeAlerts];
  }

  public getThresholds(): Threshold[] {
    return [...this.thresholds];
  }

  // --- Provider registry finder helper ---

  private getOrCreateProvider<T>(providerId: string): T {
    let provider = this.registry.getProvider<any>(providerId);
    if (!provider) {
      // Create and register via factory fallback fallback
      const { providerFactory } = require("../infrastructure/factories/provider-factory");
      provider = providerFactory.createAndRegisterProvider(providerId);
    }
    return provider as T;
  }

  // --- Periodic Telemetry & Alert Checks (Step 14 & 13) ---

  private startBackgroundMonitoring() {
    // Collect telemetry snapshot every 5 seconds
    setInterval(async () => {
      try {
        const cpu = await this.getCpu();
        const mem = await this.getMemory();
        const gpu = await this.getGpu();
        const filesystems = await this.getFilesystems();

        // 1. Compile Performance Snapshot
        const memoryUsagePercent = Math.round((mem.used / mem.total) * 100);
        const gpuLoad = gpu.devices[0]?.utilization ?? 0;
        
        const snapshot: PerformanceSnapshot = {
          timestamp: Date.now(),
          cpuLoad: cpu.load,
          memoryUsagePercent,
          diskIops: 25 + Math.round(Math.random() * 50),
          networkThroughput: {
            rx: 10 * 1024 + Math.round(Math.random() * 100 * 1024),
            tx: 5 * 1024 + Math.round(Math.random() * 50 * 1024)
          },
          gpuLoad
        };

        this.performanceHistory.push(snapshot);
        if (this.performanceHistory.length > 100) {
          this.performanceHistory.shift();
        }

        // Publish snapshot collection event
        eventBus.publish({
          name: "MetricCollected",
          source: "infrastructure-service",
          version: "v1",
          priority: "low",
          securityClassification: "internal",
          retentionPolicy: "temp",
          payload: snapshot
        } as any);

        // 2. Threshold checks (Step 13)
        const alertsList: Alert[] = [];

        // CPU Check
        const cpuThresh = this.thresholds.find(t => t.metricName === "cpu_load")!;
        if (cpu.load >= cpuThresh.criticalLimit) {
          alertsList.push({
            id: `alert-cpu-${Date.now()}`,
            entityId: "cpu-0",
            entityType: "cpu",
            severity: "critical",
            message: `CPU load critical at ${cpu.load}% (Threshold: >=${cpuThresh.criticalLimit}%)`,
            timestamp: Date.now(),
            thresholdId: cpuThresh.id
          });
        } else if (cpu.load >= cpuThresh.warningLimit) {
          alertsList.push({
            id: `alert-cpu-${Date.now()}`,
            entityId: "cpu-0",
            entityType: "cpu",
            severity: "warning",
            message: `CPU load high at ${cpu.load}% (Threshold: >=${cpuThresh.warningLimit}%)`,
            timestamp: Date.now(),
            thresholdId: cpuThresh.id
          });
        }

        // Memory Check
        const memThresh = this.thresholds.find(t => t.metricName === "mem_usage")!;
        if (memoryUsagePercent >= memThresh.criticalLimit) {
          alertsList.push({
            id: `alert-mem-${Date.now()}`,
            entityId: "mem-0",
            entityType: "memory",
            severity: "critical",
            message: `Memory usage critical at ${memoryUsagePercent}% (Threshold: >=${memThresh.criticalLimit}%)`,
            timestamp: Date.now(),
            thresholdId: memThresh.id
          });
        } else if (memoryUsagePercent >= memThresh.warningLimit) {
          alertsList.push({
            id: `alert-mem-${Date.now()}`,
            entityId: "mem-0",
            entityType: "memory",
            severity: "warning",
            message: `Memory usage high at ${memoryUsagePercent}% (Threshold: >=${memThresh.warningLimit}%)`,
            timestamp: Date.now(),
            thresholdId: memThresh.id
          });
        }

        // Filesystems check
        const diskThresh = this.thresholds.find(t => t.metricName === "disk_usage")!;
        filesystems.forEach(fs => {
          if (fs.usagePercentage >= diskThresh.criticalLimit) {
            alertsList.push({
              id: `alert-disk-${fs.path.replace(":", "")}-${Date.now()}`,
              entityId: fs.path,
              entityType: "storage",
              severity: "critical",
              message: `Filesystem capacity critical on ${fs.path} at ${fs.usagePercentage}% (Threshold: >=${diskThresh.criticalLimit}%)`,
              timestamp: Date.now(),
              thresholdId: diskThresh.id
            });
          } else if (fs.usagePercentage >= diskThresh.warningLimit) {
            alertsList.push({
              id: `alert-disk-${fs.path.replace(":", "")}-${Date.now()}`,
              entityId: fs.path,
              entityType: "storage",
              severity: "warning",
              message: `Filesystem capacity warning on ${fs.path} at ${fs.usagePercentage}% (Threshold: >=${diskThresh.warningLimit}%)`,
              timestamp: Date.now(),
              thresholdId: diskThresh.id
            });
          }
        });

        // Retain and stream alerts
        this.activeAlerts = alertsList;
        if (alertsList.length > 0) {
          alertsList.forEach(alert => {
            eventBus.publish({
              name: "InfrastructureAlert",
              source: "infrastructure-service",
              version: "v1",
              priority: alert.severity === "critical" ? "critical" : "high",
              securityClassification: "internal",
              retentionPolicy: "session",
              payload: alert
            } as any);
          });
        }

      } catch (err) {
        console.error("[InfrastructureService] Error in background monitoring:", err);
      }
    }, 5000);
  }
}

export const infrastructureService = InfrastructureService.getInstance();
