// ============================================================================
// Resource Management Layer — Connection Pools, Memory, VRAM, and Throttling
// ============================================================================

import { resourceScheduler } from '../../infrastructure/scheduling/resource-scheduler';
import { jobQueue } from '../../infrastructure/jobs/job-queue';
import prisma from '../../infrastructure/db/prisma';

export interface ResourceMetrics {
  cpuUsage: number;
  memoryUsagePercent: number;
  vramUsedGb: number;
  maxVramGb: number;
  activeBackgroundJobs: number;
  databaseConnections: number;
  throttled: boolean;
}

export class ResourceManager {
  private static instance: ResourceManager | null = null;
  
  private memoryThreshold = 0.85; // Alert if > 85% RAM used
  private lastCheckedTime = 0;
  private cachedMetrics: ResourceMetrics | null = null;

  private constructor() {}

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Request VRAM allocation for a model using the ResourceScheduler eviction policy.
   */
  public allocateVram(modelName: string): { allowed: boolean; reason: string } {
    console.log(`[ResourceManager] Allocating resources for model: ${modelName}`);
    return resourceScheduler.scheduleRequest(modelName, 'interactive');
  }

  /**
   * Check if system is currently throttled due to resource constraints.
   */
  public isThrottled(): boolean {
    const metrics = this.getMetrics();
    return metrics.throttled;
  }

  /**
   * Get central resource metrics across connections, memory, VRAM, and jobs.
   */
  public getMetrics(): ResourceMetrics {
    const now = Date.now();
    if (this.cachedMetrics && now - this.lastCheckedTime < 5000) {
      return this.cachedMetrics;
    }

    // Determine memory metrics
    let memPercent = 0.15;
    if (typeof process !== 'undefined') {
      const usage = process.memoryUsage();
      memPercent = usage.heapUsed / usage.heapTotal;
    }

    // Get scheduling stats
    const queueStats = resourceScheduler.getQueueStats();

    // Determine active background jobs
    let activeJobs = 0;
    try {
      // Accessing local in-memory backlog or running saga jobs
      activeJobs = queueStats.interactiveBacklog + queueStats.backgroundBacklog;
    } catch {}

    // Track active database connection checks
    let dbStatus = 1;
    try {
      // Simulate pinging DB connection pool
      prisma.$queryRaw`SELECT 1`.catch(() => { dbStatus = 0; });
    } catch {
      dbStatus = 0;
    }

    const throttled = memPercent > this.memoryThreshold || activeJobs > 10;

    this.cachedMetrics = {
      cpuUsage: Math.floor(Math.random() * 20) + 5, // Simulated base CPU
      memoryUsagePercent: parseFloat(memPercent.toFixed(4)),
      vramUsedGb: queueStats.vramUsedGb,
      maxVramGb: queueStats.maxVramGb,
      activeBackgroundJobs: activeJobs,
      databaseConnections: dbStatus,
      throttled,
    };
    this.lastCheckedTime = now;

    return this.cachedMetrics;
  }

  /**
   * Set custom memory threshold.
   */
  public setMemoryThreshold(threshold: number): void {
    if (threshold > 0 && threshold <= 1) {
      this.memoryThreshold = threshold;
    }
  }
}

export const resourceManager = ResourceManager.getInstance();
export default resourceManager;
