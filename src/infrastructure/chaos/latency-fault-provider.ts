/**
 * Latency Fault Provider
 * 
 * Injects artificial latency into API clients, fetches, or database queries
 * using in-process wrappers and interceptors. Provider-agnostic at configuration layer.
 */

import type { IChaosFaultProvider, ChaosStep } from '../../platform/validation/chaos/types';

// Global latency interceptor register for fetch/DB calls
export class LatencyInterceptorRegistry {
  private static latencyMap: Map<string, number> = new Map();

  public static setLatency(target: string, delayMs: number) {
    this.latencyMap.set(target.toLowerCase(), delayMs);
    console.log(`[LatencyInterceptorRegistry] Active latency rule: "${target}" delayed by ${delayMs}ms`);
  }

  public static clearLatency(target: string) {
    this.latencyMap.delete(target.toLowerCase());
    console.log(`[LatencyInterceptorRegistry] Cleared latency rule for "${target}"`);
  }

  public static async executeWithDelay<T>(target: string, operation: () => Promise<T>): Promise<T> {
    const delay = this.latencyMap.get(target.toLowerCase()) || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return await operation();
  }
}

export class LatencyFaultProvider implements IChaosFaultProvider {
  public readonly providerId = 'latency-fault-provider';
  public readonly supportedCategories = ['latency' as const];

  public async inject(step: ChaosStep): Promise<boolean> {
    const delayMs = step.parameters?.delayMs ?? 1000;
    LatencyInterceptorRegistry.setLatency(step.target, delayMs);
    return true;
  }

  public async recover(step: ChaosStep): Promise<boolean> {
    LatencyInterceptorRegistry.clearLatency(step.target);
    return true;
  }
}
