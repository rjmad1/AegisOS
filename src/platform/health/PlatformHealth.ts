// ============================================================================
// Platform Health — Structured Enterprise Health Reports
// ============================================================================

import prisma from '../../infrastructure/db/prisma';
import { deploymentManager } from '../../infrastructure/deployment/deployment-manager';
import { platformDiagnostics } from '../diagnostics/PlatformDiagnostics';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  timestamp: string;
}

export interface EnterpriseHealthReport {
  status: HealthStatus;
  uptimeSeconds: number;
  timestamp: string;
  components: {
    database: ComponentHealth;
    ollamaApi: ComponentHealth;
    liteLlmProxy: ComponentHealth;
    platformKernel: ComponentHealth;
  };
  metrics: {
    memoryUsagePercent: number;
    errorRate: number;
  };
}

export class PlatformHealth {
  private static instance: PlatformHealth | null = null;
  private bootTime = Date.now();

  private constructor() {}

  public static getInstance(): PlatformHealth {
    if (!PlatformHealth.instance) {
      PlatformHealth.instance = new PlatformHealth();
    }
    return PlatformHealth.instance;
  }

  /**
   * Run structured health checks on all central platform systems.
   */
  public async getHealthReport(): Promise<EnterpriseHealthReport> {
    const timestamp = new Date().toISOString();
    
    // 1. Check SQLite database health
    const startDb = Date.now();
    let dbStatus: HealthStatus = 'healthy';
    let dbMessage = 'Database connection healthy.';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'unhealthy';
      dbMessage = `Prisma connection failed: ${err.message}`;
    }
    const dbLatency = Date.now() - startDb;

    // 2. Check Ollama API (Port 11434)
    const startOllama = Date.now();
    const ollamaActive = await deploymentManager.checkPort(11434);
    const ollamaStatus: HealthStatus = ollamaActive ? 'healthy' : 'degraded';
    const ollamaLatency = Date.now() - startOllama;

    // 3. Check LiteLLM Router Proxy (Port 4000)
    const startLiteLlm = Date.now();
    const liteLlmActive = await deploymentManager.checkPort(4000);
    const liteLlmStatus: HealthStatus = liteLlmActive ? 'healthy' : 'degraded';
    const liteLlmLatency = Date.now() - startLiteLlm;

    // 4. Check platform kernel diagnostics
    const diag = await platformDiagnostics.diagnoseAndHeal();
    const kernelStatus: HealthStatus = diag.healthy ? 'healthy' : 'degraded';

    // 5. Determine overall health status
    let overallStatus: HealthStatus = 'healthy';
    if (dbStatus === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (ollamaStatus === 'degraded' || liteLlmStatus === 'degraded' || kernelStatus === 'degraded') {
      overallStatus = 'degraded';
    }

    // Determine memory usage percentage
    let memPercent = 0;
    if (typeof process !== 'undefined') {
      const usage = process.memoryUsage();
      memPercent = usage.heapUsed / usage.heapTotal;
    }

    return {
      status: overallStatus,
      uptimeSeconds: Math.floor((Date.now() - this.bootTime) / 1000),
      timestamp,
      components: {
        database: {
          status: dbStatus,
          latencyMs: dbLatency,
          message: dbMessage,
          timestamp,
        },
        ollamaApi: {
          status: ollamaStatus,
          latencyMs: ollamaLatency,
          message: ollamaActive ? 'Port listener active.' : 'Port 11434 unresponsive.',
          timestamp,
        },
        liteLlmProxy: {
          status: liteLlmStatus,
          latencyMs: liteLlmLatency,
          message: liteLlmActive ? 'Port listener active.' : 'Port 4000 unresponsive.',
          timestamp,
        },
        platformKernel: {
          status: kernelStatus,
          latencyMs: 0,
          message: diag.healthy ? 'Kernel services running normally.' : `Diagnostics issues: ${diag.issues.join(', ')}`,
          timestamp,
        },
      },
      metrics: {
        memoryUsagePercent: parseFloat(memPercent.toFixed(4)),
        errorRate: diag.activeErrorCount,
      },
    };
  }
}

export const platformHealth = PlatformHealth.getInstance();
export default platformHealth;
