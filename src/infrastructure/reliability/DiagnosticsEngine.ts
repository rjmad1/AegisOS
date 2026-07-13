import { deploymentManager } from "../deployment/deployment-manager";
import * as fs from "fs";
import * as path from "path";

export interface DeepDiagnosticItem {
  id: string;
  name: string;
  category: "compute" | "storage" | "network" | "gpu" | "database" | "security";
  status: "healthy" | "warning" | "critical";
  message: string;
  metricsValue: string;
}

export class DiagnosticsEngine {
  private static instance: DiagnosticsEngine | null = null;

  private constructor() {}

  public static getInstance(): DiagnosticsEngine {
    if (!DiagnosticsEngine.instance) {
      DiagnosticsEngine.instance = new DiagnosticsEngine();
    }
    return DiagnosticsEngine.instance;
  }

  public async runDeepDiagnostics(): Promise<DeepDiagnosticItem[]> {
    const items: DeepDiagnosticItem[] = [];
    const metrics = deploymentManager.getSystemMetrics();
    const env = deploymentManager.getHostEnvironment();

    // 1. CPU Saturation
    const cpuUsage = metrics.cpu.usagePercentage;
    let cpuStatus: "healthy" | "warning" | "critical" = "healthy";
    let cpuMsg = "CPU load is optimal.";
    if (cpuUsage > 90) {
      cpuStatus = "critical";
      cpuMsg = "CPU Saturation detected! Core bottleneck.";
    } else if (cpuUsage > 75) {
      cpuStatus = "warning";
      cpuMsg = "High CPU load. Approaching capacity limits.";
    }
    items.push({
      id: "cpu-saturation",
      name: "CPU Compute Saturation",
      category: "compute",
      status: cpuStatus,
      message: cpuMsg,
      metricsValue: `${cpuUsage}% Usage`
    });

    // 2. Memory Leaks
    const memUsedPercent = (metrics.memory.usedBytes / metrics.memory.totalBytes) * 100;
    let memStatus: "healthy" | "warning" | "critical" = "healthy";
    let memMsg = "Memory footprint is within limits.";
    if (memUsedPercent > 92) {
      memStatus = "critical";
      memMsg = "Memory Exhaustion detected. Potential leak in background job loops.";
    } else if (memUsedPercent > 80) {
      memStatus = "warning";
      memMsg = "High memory usage. Active GC cycles required.";
    }
    items.push({
      id: "memory-leak",
      name: "Node Heap & Memory Leak Detection",
      category: "compute",
      status: memStatus,
      message: memMsg,
      metricsValue: `${memUsedPercent.toFixed(1)}% Active`
    });

    // 3. GPU Saturation
    const gpuVramPercent = (metrics.gpu.usedVramBytes / metrics.gpu.totalVramBytes) * 100;
    let gpuStatus: "healthy" | "warning" | "critical" = "healthy";
    let gpuMsg = "GPU VRAM allocations are healthy.";
    if (gpuVramPercent > 95) {
      gpuStatus = "critical";
      gpuMsg = "GPU VRAM Saturation! Model token response degraded.";
    } else if (gpuVramPercent > 80) {
      gpuStatus = "warning";
      gpuMsg = "High GPU utilization. Concurrent requests queued.";
    }
    items.push({
      id: "gpu-saturation",
      name: "GPU VRAM Allocation Saturation",
      category: "gpu",
      status: gpuStatus,
      message: gpuMsg,
      metricsValue: `${gpuVramPercent.toFixed(1)}% VRAM`
    });

    // 4. Connection Pool Exhaustion
    // Mocking active DB connections count vs limit
    const mockDbConns = 18;
    const maxDbConns = 20;
    const connPercent = (mockDbConns / maxDbConns) * 100;
    let connStatus: "healthy" | "warning" | "critical" = "healthy";
    let connMsg = "Database connection pool is operating within parameters.";
    if (connPercent > 85) {
      connStatus = "critical";
      connMsg = "Prisma Connection Pool Exhaustion. Queries are blocking.";
    }
    items.push({
      id: "db-pool",
      name: "Database Connection Pool Exhaustion",
      category: "database",
      status: connStatus,
      message: connMsg,
      metricsValue: `${mockDbConns}/${maxDbConns} Handles`
    });

    // 5. Config Drift
    let driftStatus: "healthy" | "warning" | "critical" = "healthy";
    let driftMsg = "Local configurations match repository source.";
    const hasDrift = fs.existsSync(path.resolve(process.cwd(), "console_config.json.drift"));
    if (hasDrift) {
      driftStatus = "warning";
      driftMsg = "Configuration drift detected. Env overrides disagree with baseline.";
    }
    items.push({
      id: "config-drift",
      name: "Central Configuration Drift Monitor",
      category: "security",
      status: driftStatus,
      message: driftMsg,
      metricsValue: hasDrift ? "Drift Active" : "In Sync"
    });

    // 6. SSL Certificate Expiry (Mocking Let's Encrypt renewal state)
    let certStatus: "healthy" | "warning" | "critical" = "healthy";
    let certMsg = "SSL Certificates are valid.";
    const daysLeft = 14; // Mocking days to certificate expiration
    if (daysLeft < 7) {
      certStatus = "critical";
      certMsg = `SSL Certificate expires in ${daysLeft} days! Renewal pipeline blocked.`;
    } else if (daysLeft < 30) {
      certStatus = "warning";
      certMsg = `SSL Certificate renewal scheduled. Valid for ${daysLeft} days.`;
    }
    items.push({
      id: "cert-expiration",
      name: "mTLS & SSL Certificate Expiration Check",
      category: "security",
      status: certStatus,
      message: certMsg,
      metricsValue: `${daysLeft} Days Left`
    });

    // 7. Disk Space Exhaustion
    const freeGb = metrics.storage[0].freeBytes / (1024 * 1024 * 1024);
    const totalGb = metrics.storage[0].totalBytes / (1024 * 1024 * 1024);
    const diskPercent = ((totalGb - freeGb) / totalGb) * 100;
    let diskStatus: "healthy" | "warning" | "critical" = "healthy";
    let diskMsg = "Disk storage capacity is ample.";
    if (diskPercent > 90) {
      diskStatus = "critical";
      diskMsg = "Disk Space Exhaustion! Writing backups or traces will fail.";
    } else if (diskPercent > 75) {
      diskStatus = "warning";
      diskMsg = "Disk space exceeds 75%. Automated cleanup recommended.";
    }
    items.push({
      id: "disk-exhaustion",
      name: "Disk Space Capacity monitor",
      category: "storage",
      status: diskStatus,
      message: diskMsg,
      metricsValue: `${diskPercent.toFixed(1)}% Full`
    });

    return items;
  }
}

export const diagnosticsEngine = DiagnosticsEngine.getInstance();
export default diagnosticsEngine;
