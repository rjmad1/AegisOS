// src/enterprise/operations/CapacityDashboard.ts
// Capacity Dashboard — Tracks active capacity limits, headrooms, and scaling alerts

import { capacityPlanningEngine } from '../performance/CapacityPlanningEngine';

export interface CapacityAlert {
  resource: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  currentValue: string;
  limitValue: string;
}

export interface CapacityDashboardData {
  concurrentTarget: number;
  allocatedCores: number;
  allocatedMemoryGb: number;
  allocatedGpus: number;
  storageTb: number;
  headroomBufferPercent: number;
  alerts: CapacityAlert[];
}

export class CapacityDashboard {
  private static instance: CapacityDashboard | null = null;

  private constructor() {}

  public static getInstance(): CapacityDashboard {
    if (!CapacityDashboard.instance) {
      CapacityDashboard.instance = new CapacityDashboard();
    }
    return CapacityDashboard.instance;
  }

  public getDashboardData(concurrency = 10000): CapacityDashboardData {
    const plan = capacityPlanningEngine.generateCapacityPlan(concurrency);
    const alerts: CapacityAlert[] = [];

    // Simulate active resource utilization to trigger alerts
    const cpuUtil = 82; // 82% utilized
    const dbConns = Math.ceil(plan.allocatedResources.databaseConnections * 0.78); // 78% utilized

    // CPU alerts
    if (cpuUtil >= 90) {
      alerts.push({
        resource: 'CPU Utilization',
        severity: 'critical',
        message: 'CPU consumption exceeds 90%. System latency might degrade.',
        currentValue: `${cpuUtil}%`,
        limitValue: '100%',
      });
    } else if (cpuUtil >= 75) {
      alerts.push({
        resource: 'CPU Utilization',
        severity: 'warning',
        message: 'CPU consumption has passed warn threshold of 75%. Autoscaler triggered.',
        currentValue: `${cpuUtil}%`,
        limitValue: '100%',
      });
    }

    // DB Connection alerts
    const dbWarn = Math.round(plan.allocatedResources.databaseConnections * 0.70);
    if (dbConns >= dbWarn) {
      alerts.push({
        resource: 'DB Connections',
        severity: 'warning',
        message: 'Active database connections pool usage is above 70%. Consider expanding pool size.',
        currentValue: `${dbConns} conns`,
        limitValue: `${plan.allocatedResources.databaseConnections} max`,
      });
    }

    // Default VRAM allocation alert
    alerts.push({
      resource: 'VRAM Pool',
      severity: 'info',
      message: 'KV cache quantization enabled. Operating with comfortable VRAM headroom.',
      currentValue: '10.5 GB',
      limitValue: `${plan.allocatedResources.gpuNodes * 16} GB`,
    });

    return {
      concurrentTarget: concurrency,
      allocatedCores: plan.allocatedResources.cpuCores,
      allocatedMemoryGb: plan.allocatedResources.memoryGb,
      allocatedGpus: plan.allocatedResources.gpuNodes,
      storageTb: plan.allocatedResources.storageTb,
      headroomBufferPercent: Math.round((plan.headroomFactor - 1) * 100),
      alerts,
    };
  }
}

export const capacityDashboard = CapacityDashboard.getInstance();
export default capacityDashboard;
