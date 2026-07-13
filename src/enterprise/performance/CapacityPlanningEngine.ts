// src/enterprise/performance/CapacityPlanningEngine.ts
// Capacity Planning Engine — Headroom estimation, resource thresholds, scaling boundaries

export interface ResourceAllocation {
  cpuCores: number;
  memoryGb: number;
  gpuNodes: number;
  storageTb: number;
  networkBandwidthGbps: number;
  databaseConnections: number;
}

export interface CapacityThresholds {
  resource: string;
  limit: number;
  warnPercent: number;
  criticalPercent: number;
}

export interface CapacityPlan {
  concurrentTarget: number;
  allocatedResources: ResourceAllocation;
  headroomFactor: number; // e.g. 1.3 (30% buffer)
  warnThresholds: CapacityThresholds[];
}

export class CapacityPlanningEngine {
  private static instance: CapacityPlanningEngine | null = null;

  private constructor() {}

  public static getInstance(): CapacityPlanningEngine {
    if (!CapacityPlanningEngine.instance) {
      CapacityPlanningEngine.instance = new CapacityPlanningEngine();
    }
    return CapacityPlanningEngine.instance;
  }

  public generateCapacityPlan(concurrencyTarget: number): CapacityPlan {
    // Model scaling requirements
    const cpuCores = Math.max(8, Math.ceil(concurrencyTarget * 0.08));
    const memoryGb = Math.max(16, Math.ceil(concurrencyTarget * 0.32));
    const gpuNodes = Math.max(1, Math.ceil(concurrencyTarget * 0.005));
    const storageTb = Math.max(0.5, Number((concurrencyTarget * 0.002).toFixed(2)));
    const networkBandwidthGbps = Math.max(1, Number((concurrencyTarget * 0.01).toFixed(2)));
    const databaseConnections = Math.max(50, Math.min(1500, Math.ceil(concurrencyTarget * 0.05)));

    const allocatedResources: ResourceAllocation = {
      cpuCores,
      memoryGb,
      gpuNodes,
      storageTb,
      networkBandwidthGbps,
      databaseConnections,
    };

    const warnThresholds: CapacityThresholds[] = [
      { resource: 'CPU Utilization', limit: 100, warnPercent: 75, criticalPercent: 90 },
      { resource: 'Memory Utilization', limit: 100, warnPercent: 80, criticalPercent: 92 },
      { resource: 'VRAM Pool', limit: 100, warnPercent: 85, criticalPercent: 95 },
      { resource: 'DB Connection Limit', limit: databaseConnections, warnPercent: 70, criticalPercent: 88 },
      { resource: 'Disk Capacity', limit: storageTb * 1000, warnPercent: 75, criticalPercent: 90 },
    ];

    return {
      concurrentTarget: concurrencyTarget,
      allocatedResources,
      headroomFactor: 1.35, // 35% safe headroom
      warnThresholds,
    };
  }
}

export const capacityPlanningEngine = CapacityPlanningEngine.getInstance();
export default capacityPlanningEngine;
