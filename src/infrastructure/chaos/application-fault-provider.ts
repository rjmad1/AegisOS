/**
 * Application Fault Provider
 * 
 * Simulates application-level faults (workflow cancellation, capability crash,
 * participant crash, context overflow, token exhaustion).
 */

import type { IChaosFaultProvider, ChaosStep } from '../../platform/validation/chaos/types';

// Global hooks for in-process application logic to test failure modes
export class ApplicationFailureRegistry {
  private static failures: Set<string> = new Set();

  public static setFailure(type: string) {
    this.failures.add(type.toLowerCase());
  }

  public static clearFailure(type: string) {
    this.failures.delete(type.toLowerCase());
  }

  public static checkFailure(type: string): boolean {
    return this.failures.has(type.toLowerCase());
  }
}

export class ApplicationFaultProvider implements IChaosFaultProvider {
  public readonly providerId = 'application-fault-provider';
  public readonly supportedCategories = ['dependency_unavailability' as const, 'partial_outage' as const];

  public async inject(step: ChaosStep): Promise<boolean> {
    console.log(`[ApplicationFaultProvider] Injecting app fault: "${step.action}" on target: "${step.target}"`);
    ApplicationFailureRegistry.setFailure(step.target);
    return true;
  }

  public async recover(step: ChaosStep): Promise<boolean> {
    console.log(`[ApplicationFaultProvider] Recovering app fault: "${step.action}" on target: "${step.target}"`);
    ApplicationFailureRegistry.clearFailure(step.target);
    return true;
  }
}
