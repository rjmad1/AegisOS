import { NextResponse } from "next/server";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";
import { runtimeService } from "@/services/runtime.service";
import { ProviderRegistry } from "@/infrastructure/providers/registry";
import * as fs from "fs";
import * as path from "path";

const startTime = Date.now();

export async function GET() {
  try {
    const registry = ProviderRegistry.getInstance();
    const systemMetrics = deploymentManager.getSystemMetrics();
    const hostEnv = deploymentManager.getHostEnvironment();
    
    // Check if configuration exists
    const configPath = process.env.OPS_CONFIG_PATH || path.resolve(process.cwd(), "console_config.json");
    const isConfigValid = fs.existsSync(configPath);
    let configSize = 0;
    if (isConfigValid) {
      configSize = fs.statSync(configPath).size;
    }

    // Checking provider availability
    const providers = [
      { id: "ollama-provider", name: "Ollama Inference Engine" },
      { id: "litellm-provider", name: "LiteLLM Routing Proxy" },
      { id: "aegisos-runtime-provider", name: "AegisOS Runtime" }
    ];

    const providerStates = [];
    for (const p of providers) {
      const provider = registry.getProvider(p.id);
      let status = "offline";
      let error = null;
      if (provider) {
        try {
          if (typeof (provider as any).checkHealth === "function") {
            const health = await (provider as any).checkHealth();
            status = health.status === "healthy" ? "online" : health.status === "degraded" ? "degraded" : "offline";
            error = health.errorMessage || null;
          } else {
            status = "online";
          }
        } catch (e) {
          status = "error";
          error = String(e);
        }
      }
      providerStates.push({
        id: p.id,
        name: p.name,
        status,
        error
      });
    }

    // Checking if port 8443 or 443 is listening (simulates certificate/proxy binding status)
    const isProxyActive = await deploymentManager.checkPort(8443) || await deploymentManager.checkPort(443);

    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const buildVersion = process.env.OPS_BUILD_VERSION || "1.0.0";
    const deploymentDate = process.env.OPS_DEPLOYMENT_DATE || "2026-07-11";
    const gitCommit = process.env.OPS_GIT_COMMIT || "local-dev";

    const report = {
      appVersion: "1.0.0",
      buildVersion,
      gitCommit,
      deploymentDate,
      environment: process.env.NODE_ENV || "production",
      runningSince: new Date(startTime).toISOString(),
      uptimeSeconds: uptime,
      configuration: {
        path: configPath,
        status: isConfigValid ? "active" : "missing",
        sizeBytes: configSize,
        databasesDir: process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases"),
        artifactsDir: process.env.OPS_ARTIFACTS_DIR || path.resolve(process.cwd(), "artifacts_storage")
      },
      providers: providerStates,
      certificate: {
        status: isProxyActive ? "bound" : "pending",
        provider: "Caddy Internal CA / Let's Encrypt",
        port: 8443
      },
      diskUsage: systemMetrics.storage.map(s => ({
        drive: s.driveLetter,
        totalBytes: s.totalBytes,
        freeBytes: s.freeBytes,
        usedBytes: s.totalBytes - s.freeBytes,
        percentUsed: Math.round(((s.totalBytes - s.freeBytes) / s.totalBytes) * 100)
      }))
    };

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
