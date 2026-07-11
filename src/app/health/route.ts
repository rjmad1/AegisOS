import { NextResponse } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";
import { ProviderRegistry } from "@/infrastructure/providers/registry";

const startTime = Date.now();

export async function GET() {
  try {
    const runtime = await runtimeService.getRuntime();
    const systemMetrics = deploymentManager.getSystemMetrics();
    const hostEnv = deploymentManager.getHostEnvironment();
    
    // Check provider health status from registry
    const registry = ProviderRegistry.getInstance();
    const defaultProviderIds = [
      "ollama-provider",
      "litellm-provider",
      "openclaw-runtime-provider",
      "docker-provider",
      "windows-provider"
    ];

    const providerStatuses: Record<string, any> = {};
    for (const id of defaultProviderIds) {
      const provider = registry.getProvider(id);
      if (provider) {
        let health: any = { status: "unknown" };
        try {
          if (typeof (provider as any).checkHealth === "function") {
            health = await (provider as any).checkHealth();
          }
        } catch (e) {
          health = { status: "unhealthy", error: String(e) };
        }
        providerStatuses[provider.id] = {
          name: provider.name,
          status: health.status
        };
      }
    }

    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const buildVersion = process.env.OPS_BUILD_VERSION || "1.0.0";
    const deploymentDate = process.env.OPS_DEPLOYMENT_DATE || "2026-07-11";
    const gitCommit = process.env.OPS_GIT_COMMIT || "local-dev";

    const healthReport = {
      status: runtime.status === "online" ? "healthy" : "degraded",
      application: {
        name: "AI Operations Console",
        version: "1.0.0",
        buildVersion,
        gitCommit,
        deploymentDate,
        environment: process.env.NODE_ENV || "production",
        uptimeSeconds: uptime,
        runningSince: new Date(startTime).toISOString(),
        nodeVersion: hostEnv.nodeVersion,
        platform: hostEnv.osPlatform
      },
      system: {
        cpuLoadPercent: systemMetrics.cpu.usagePercentage,
        memoryUsagePercent: Math.round(((systemMetrics.memory.totalBytes - systemMetrics.memory.freeBytes) / systemMetrics.memory.totalBytes) * 100),
        gpu: {
          name: systemMetrics.gpu.name,
          vramUsagePercent: Math.round((systemMetrics.gpu.usedVramBytes / systemMetrics.gpu.totalVramBytes) * 100),
          temperatureC: systemMetrics.gpu.temperatureC
        },
        storage: systemMetrics.storage.map(s => ({
          drive: s.driveLetter,
          freeGb: Math.round(s.freeBytes / (1024 * 1024 * 1024)),
          totalGb: Math.round(s.totalBytes / (1024 * 1024 * 1024)),
          usagePercent: Math.round(((s.totalBytes - s.freeBytes) / s.totalBytes) * 100)
        }))
      },
      runtime: {
        id: runtime.id,
        status: runtime.status,
        mcpServersCount: runtime.configuration?.mcpServers?.length || 0,
        capabilities: runtime.capabilities?.map(c => c.name) || []
      },
      providers: providerStatuses,
      dependencies: {
        databases: runtime.health?.details?.checks?.map((c: any) => ({
          name: c.name,
          status: c.status,
          message: c.message
        })) || []
      },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(healthReport);
  } catch (err: any) {
    return NextResponse.json(
      { status: "unhealthy", error: err.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
