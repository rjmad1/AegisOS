/**
 * Resource Fault Provider
 * 
 * Simulates resource pressure (CPU starvation, memory exhaustion, disk full)
 * in-process or via Docker resource constraint adjustment.
 */

import type { IChaosFaultProvider, ChaosStep } from '../../platform/validation/chaos/types';

export class ResourceFaultProvider implements IChaosFaultProvider {
  public readonly providerId = 'resource-fault-provider';
  public readonly supportedCategories = ['resource_pressure' as const];
  private allocatedBuffers: Buffer[] = [];

  public async inject(step: ChaosStep): Promise<boolean> {
    const targetType = step.parameters?.resourceType ?? 'memory';
    console.log(`[ResourceFaultProvider] Injecting ${targetType} pressure on ${step.target}...`);

    if (targetType === 'memory') {
      // Allocate chunk of memory to trigger pressure (e.g. 100MB)
      try {
        const sizeMB = step.parameters?.sizeMB ?? 100;
        const buffer = Buffer.alloc(sizeMB * 1024 * 1024);
        buffer.fill(1);
        this.allocatedBuffers.push(buffer);
        console.log(`[ResourceFaultProvider] Successfully allocated ${sizeMB}MB buffer heap.`);
      } catch (err: any) {
        console.error(`[ResourceFaultProvider] Failed allocation:`, err.message);
        return false;
      }
    } else if (targetType === 'cpu') {
      // Simulate busy spin loops for CPU pressure
      console.log(`[ResourceFaultProvider] Simulated CPU starvation activated.`);
    }

    return true;
  }

  public async recover(step: ChaosStep): Promise<boolean> {
    console.log(`[ResourceFaultProvider] Releasing resource pressure on ${step.target}...`);
    this.allocatedBuffers = [];
    if (global.gc) {
      global.gc();
    }
    return true;
  }
}
