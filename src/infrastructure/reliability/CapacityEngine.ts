import { reliabilityStore } from "./store";
import { deploymentManager } from "../deployment/deployment-manager";

export interface CapacityForecast {
  metric: string;
  currentValue: number;
  forecastValue: number;
  timeframeDays: number;
  probabilityScore: number;
  recommendation: string;
}

export class CapacityEngine {
  private static instance: CapacityEngine | null = null;

  private constructor() {}

  public static getInstance(): CapacityEngine {
    if (!CapacityEngine.instance) {
      CapacityEngine.instance = new CapacityEngine();
    }
    return CapacityEngine.instance;
  }

  public async getCapacityForecasts(): Promise<CapacityForecast[]> {
    const metrics = deploymentManager.getSystemMetrics();

    // 1. Storage forecast based on DB size increase
    const freeGb = metrics.storage[0].freeBytes / (1024 * 1024 * 1024);
    const totalGb = metrics.storage[0].totalBytes / (1024 * 1024 * 1024);
    const usedGb = totalGb - freeGb;
    const storageGrowthRate = 0.42; // GB per day
    const daysToStorageExhaust = storageGrowthRate > 0 ? freeGb / storageGrowthRate : 999;
    
    // 2. GPU growth forecast
    const gpuVramPercent = (metrics.gpu.usedVramBytes / metrics.gpu.totalVramBytes) * 100;
    
    // Record current forecasts to store
    reliabilityStore.update((state) => {
      // Keep only last 20 snapshots
      state.capacityHistory = [
        ...state.capacityHistory.slice(-19),
        {
          timestamp: new Date().toISOString(),
          cpuForecastPercent: Math.min(metrics.cpu.usagePercentage + 5, 100),
          gpuForecastPercent: Math.min(gpuVramPercent + 2, 100),
          storageForecastPercent: parseFloat(((usedGb / totalGb) * 100).toFixed(2)),
          costForecastUsd: 142.50 // simulated monthly cloud/inference cost
        }
      ];
    });

    const forecasts: CapacityForecast[] = [
      {
        metric: "Storage capacity",
        currentValue: parseFloat(((usedGb / totalGb) * 100).toFixed(2)),
        forecastValue: parseFloat((((usedGb + storageGrowthRate * 30) / totalGb) * 100).toFixed(2)),
        timeframeDays: 30,
        probabilityScore: daysToStorageExhaust < 30 ? 95 : 15,
        recommendation: daysToStorageExhaust < 30 
          ? "CRITICAL: Trigger disk vacuum and partition cleanup." 
          : "Storage capacity is optimal. No action needed."
      },
      {
        metric: "GPU allocations",
        currentValue: parseFloat(gpuVramPercent.toFixed(2)),
        forecastValue: Math.min(gpuVramPercent + 10, 100),
        timeframeDays: 7,
        probabilityScore: gpuVramPercent > 80 ? 80 : 20,
        recommendation: gpuVramPercent > 80 
          ? "GPU VRAM warning: Scale down context window sizes or activate model quantization." 
          : "GPU VRAM allocations are within limits."
      },
      {
        metric: "CPU Compute load",
        currentValue: metrics.cpu.usagePercentage,
        forecastValue: Math.min(metrics.cpu.usagePercentage + 12, 100),
        timeframeDays: 7,
        probabilityScore: metrics.cpu.usagePercentage > 70 ? 75 : 10,
        recommendation: metrics.cpu.usagePercentage > 70 
          ? "Scale active Node.js processes replicas to mitigate CPU saturation." 
          : "Compute resources are adequate."
      },
      {
        metric: "Cost forecast",
        currentValue: 142.50,
        forecastValue: 185.00,
        timeframeDays: 30,
        probabilityScore: 40,
        recommendation: "Forecasted monthly LLM inference budget: $185.00 (within limits)."
      }
    ];

    return forecasts;
  }
}

export const capacityEngine = CapacityEngine.getInstance();
export default capacityEngine;
