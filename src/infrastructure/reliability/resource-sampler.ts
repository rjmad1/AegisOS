/**
 * Resource Sampler
 * 
 * Inspects process, v8 heap, and platform active handles/connections.
 */

export interface SamplerStats {
  heapUsedBytes: number;
  cpuPercent: number;
  activeHandles: number;
  activeRequests: number;
}

export class ResourceSampler {
  private static instance: ResourceSampler | null = null;
  private lastCpuUsage = process.cpuUsage();
  private lastCpuTime = Date.now();

  private constructor() {}

  public static getInstance(): ResourceSampler {
    if (!ResourceSampler.instance) {
      ResourceSampler.instance = new ResourceSampler();
    }
    return ResourceSampler.instance;
  }

  public async getStats(): Promise<SamplerStats> {
    // 1. CPU calculation
    const currentUsage = process.cpuUsage(this.lastCpuUsage);
    const currentTime = Date.now();
    const durationMs = currentTime - this.lastCpuTime;

    this.lastCpuUsage = process.cpuUsage();
    this.lastCpuTime = currentTime;

    const totalUsageMs = (currentUsage.user + currentUsage.system) / 1000;
    const cpuPercent = durationMs > 0 ? (totalUsageMs / durationMs) * 100 : 0;

    // 2. Memory
    const mem = process.memoryUsage();

    // 3. Handles & requests
    const activeHandles = (process as any)._getActiveHandles ? (process as any)._getActiveHandles().length : 0;
    const activeRequests = (process as any)._getActiveRequests ? (process as any)._getActiveRequests().length : 0;

    return {
      heapUsedBytes: mem.heapUsed,
      cpuPercent,
      activeHandles,
      activeRequests
    };
  }
}

export const resourceSampler = ResourceSampler.getInstance();
export default resourceSampler;
