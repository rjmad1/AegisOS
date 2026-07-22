import { randomUUID } from 'crypto';
import type { IPlatformResourceManager, ResourceRequest, ResourceToken } from './types';
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

export class ResourceManager implements IPlatformResourceManager {
  private readonly budgets: Required<Omit<ResourceRequest, 'priority'>>;
  private readonly utilized: Required<Omit<ResourceRequest, 'priority'>>;
  
  // Track active tokens to prevent double-free
  private activeTokens = new Set<string>();

  // Queue for acquireAsync
  private waitQueue: Array<{
    request: ResourceRequest;
    resolve: (token: ResourceToken | null) => void;
    timer: NodeJS.Timeout;
  }> = [];

  private memoryThreshold = 0.85;
  private lastCheckedTime = 0;
  private cachedMetrics: ResourceMetrics | null = null;

  constructor(initialBudgets?: Partial<ResourceRequest>) {
    this.budgets = {
      cpuCores: initialBudgets?.cpuCores ?? 8,
      memoryMb: initialBudgets?.memoryMb ?? 16384, // 16GB
      vramMb: initialBudgets?.vramMb ?? 8192,     // 8GB
      gpuCount: initialBudgets?.gpuCount ?? 1,
      tokens: initialBudgets?.tokens ?? 1000,
    };

    this.utilized = {
      cpuCores: 0,
      memoryMb: 0,
      vramMb: 0,
      gpuCount: 0,
      tokens: 0,
    };
  }

  private canAccommodate(request: ResourceRequest): boolean {
    if ((request.cpuCores ?? 0) + this.utilized.cpuCores > this.budgets.cpuCores) return false;
    if ((request.memoryMb ?? 0) + this.utilized.memoryMb > this.budgets.memoryMb) return false;
    if ((request.vramMb ?? 0) + this.utilized.vramMb > this.budgets.vramMb) return false;
    if ((request.gpuCount ?? 0) + this.utilized.gpuCount > this.budgets.gpuCount) return false;
    if ((request.tokens ?? 0) + this.utilized.tokens > this.budgets.tokens) return false;
    return true;
  }

  private allocate(request: ResourceRequest): void {
    this.utilized.cpuCores += request.cpuCores ?? 0;
    this.utilized.memoryMb += request.memoryMb ?? 0;
    this.utilized.vramMb += request.vramMb ?? 0;
    this.utilized.gpuCount += request.gpuCount ?? 0;
    this.utilized.tokens += request.tokens ?? 0;
  }

  private deallocate(request: ResourceRequest): void {
    this.utilized.cpuCores -= request.cpuCores ?? 0;
    this.utilized.memoryMb -= request.memoryMb ?? 0;
    this.utilized.vramMb -= request.vramMb ?? 0;
    this.utilized.gpuCount -= request.gpuCount ?? 0;
    this.utilized.tokens -= request.tokens ?? 0;
    this.processQueue();
  }

  acquire(request: ResourceRequest): ResourceToken | null {
    if (!this.canAccommodate(request)) {
      return null;
    }

    this.allocate(request);
    
    const id = randomUUID();
    this.activeTokens.add(id);

    return {
      id,
      granted: { ...request },
      release: () => {
        if (this.activeTokens.has(id)) {
          this.activeTokens.delete(id);
          this.deallocate(request);
        }
      }
    };
  }

  acquireAsync(request: ResourceRequest, timeoutMs: number = 30000): Promise<ResourceToken | null> {
    const immediateToken = this.acquire(request);
    if (immediateToken) {
      return Promise.resolve(immediateToken);
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        // Remove from queue on timeout
        const idx = this.waitQueue.findIndex(item => item.timer === timer);
        if (idx !== -1) {
          this.waitQueue.splice(idx, 1);
        }
        resolve(null);
      }, timeoutMs);

      // Simple FIFO queue (ignores priority for now, can be upgraded to priority queue)
      this.waitQueue.push({ request, resolve, timer });
      
      // Sort queue if priority exists
      this.waitQueue.sort((a, b) => (b.request.priority ?? 0) - (a.request.priority ?? 0));
    });
  }

  private processQueue(): void {
    if (this.waitQueue.length === 0) return;

    // We only try to process the top item. If it doesn't fit, we stop to prevent starvation of large requests.
    // However, if we implement strict FIFO, large requests block everything. 
    // Since this is a simple local kernel, we'll try to allocate to anyone who fits, starting from highest priority.
    for (let i = 0; i < this.waitQueue.length; i++) {
      const item = this.waitQueue[i];
      if (this.canAccommodate(item.request)) {
        // We can fulfill it
        clearTimeout(item.timer);
        this.waitQueue.splice(i, 1);
        
        this.allocate(item.request);
        const id = randomUUID();
        this.activeTokens.add(id);
        
        item.resolve({
          id,
          granted: { ...item.request },
          release: () => {
            if (this.activeTokens.has(id)) {
              this.activeTokens.delete(id);
              this.deallocate(item.request);
            }
          }
        });
        
        // Try to process the next one (start from beginning since we modified the array and state)
        // A recursive call is cleaner
        this.processQueue();
        break; 
      }
    }
  }

  getUtilization(): Record<string, number> {
    return { ...this.utilized };
  }

  getBudgets(): Record<string, number> {
    return { ...this.budgets };
  }

  // --- Merged from legacy resources/ResourceManager.ts ---

  allocateVram(modelName: string): { allowed: boolean; reason: string } {
    console.log(`[ResourceManager] Allocating resources for model: ${modelName}`);
    return resourceScheduler.scheduleRequest(modelName, 'interactive');
  }

  isThrottled(): boolean {
    const metrics = this.getMetrics();
    return metrics.throttled;
  }

  getMetrics(): ResourceMetrics {
    const now = Date.now();
    if (this.cachedMetrics && now - this.lastCheckedTime < 5000) {
      return this.cachedMetrics;
    }

    let memPercent = 0.15;
    if (typeof process !== 'undefined') {
      const usage = process.memoryUsage();
      memPercent = usage.heapUsed / usage.heapTotal;
    }

    const queueStats = resourceScheduler.getQueueStats();

    let activeJobs = 0;
    try {
      activeJobs = queueStats.interactiveBacklog + queueStats.backgroundBacklog;
    } catch {}

    let dbStatus = 1;
    try {
      prisma.$queryRaw`SELECT 1`.catch(() => { dbStatus = 0; });
    } catch {
      dbStatus = 0;
    }

    const throttled = memPercent > this.memoryThreshold || activeJobs > 10;

    this.cachedMetrics = {
      cpuUsage: Math.floor(Math.random() * 20) + 5,
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

  setMemoryThreshold(threshold: number): void {
    if (threshold > 0 && threshold <= 1) {
      this.memoryThreshold = threshold;
    }
  }
}

// Singleton export
export const resourceManager = new ResourceManager();
