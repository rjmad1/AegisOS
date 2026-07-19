/**
 * Corruption Fault Provider
 * 
 * Simulates configuration, cache, or database connection corruption.
 */

import type { IChaosFaultProvider, ChaosStep } from '../../platform/validation/chaos/types';

export class CorruptionFailureRegistry {
  private static corruptedTargets: Set<string> = new Set();

  public static corrupt(target: string) {
    this.corruptedTargets.add(target.toLowerCase());
  }

  public static restore(target: string) {
    this.corruptedTargets.delete(target.toLowerCase());
  }

  public static isCorrupt(target: string): boolean {
    return this.corruptedTargets.has(target.toLowerCase());
  }
}

export class CorruptionFaultProvider implements IChaosFaultProvider {
  public readonly providerId = 'corruption-fault-provider';
  public readonly supportedCategories = ['data_corruption' as const];

  public async inject(step: ChaosStep): Promise<boolean> {
    console.log(`[CorruptionFaultProvider] Corrupting data target: "${step.target}"`);
    CorruptionFailureRegistry.corrupt(step.target);
    return true;
  }

  public async recover(step: ChaosStep): Promise<boolean> {
    console.log(`[CorruptionFaultProvider] Restoring data target: "${step.target}"`);
    CorruptionFailureRegistry.restore(step.target);
    return true;
  }
}
