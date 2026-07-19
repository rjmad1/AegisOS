/**
 * Capacity Discovery Engine
 * 
 * Performs adaptive parameter sweeps by progressively stepping up concurrency
 * until a performance degradation or error rate threshold is reached,
 * mapping the boundaries of the safe operating envelope.
 */

import type { ILoadGenerator, OperatingEnvelope } from './types';

export class CapacityDiscoveryEngine {
  /**
   * Sweeps concurrency levels progressively (e.g. 5 -> 10 -> 20 -> 50)
   * to discover the optimal zone, saturation point, and failure boundaries.
   */
  public static async discoverEnvelope(
    loadGenerator: ILoadGenerator,
    maxLimit: number,
    latencyThresholdMs: number
  ): Promise<OperatingEnvelope> {
    console.log(`[CapacityDiscoveryEngine] Starting capacity sweep up to max target: ${maxLimit}`);

    const concurrencySteps = [5, 10, 20, 30, 40, 50, 75, 100].filter(c => c <= maxLimit);
    
    let optimalConcurrency = 5;
    let saturationConcurrency = 5;
    let failureBoundaryConcurrency = maxLimit;
    let bottleneckReason: string | undefined;

    for (const vus of concurrencySteps) {
      console.log(`[CapacityDiscoveryEngine] Sweeping concurrency step: ${vus}`);
      const runResult = await loadGenerator.executeLoadRun('steady', vus, 1000);

      if (runResult.errorRate > 0.04) {
        failureBoundaryConcurrency = vus;
        bottleneckReason = 'High request error rate (> 4%)';
        break;
      }

      if (runResult.avgLatencyMs > latencyThresholdMs) {
        saturationConcurrency = vus;
        bottleneckReason = `Latency exceeded SLA threshold (${latencyThresholdMs}ms)`;
        break;
      }

      optimalConcurrency = vus;
      saturationConcurrency = vus;
    }

    return {
      optimalConcurrency,
      saturationConcurrency,
      failureBoundaryConcurrency,
      bottleneckReason
    };
  }
}
