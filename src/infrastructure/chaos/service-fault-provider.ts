/**
 * Service Fault Provider
 * 
 * Injects container termination and process restarts (e.g. Ollama, LiteLLM, Postgres, Redis).
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { IChaosFaultProvider, ChaosStep } from '../../platform/validation/chaos/types';
import { deploymentManager } from '../deployment/deployment-manager';

const execAsync = promisify(exec);

export class ServiceFaultProvider implements IChaosFaultProvider {
  public readonly providerId = 'service-fault-provider';
  public readonly supportedCategories = ['service_kill' as const];

  public async inject(step: ChaosStep): Promise<boolean> {
    console.log(`[ServiceFaultProvider] Killing service target: ${step.target}`);
    try {
      // Use deploymentManager stop capability
      await deploymentManager.controlService(step.target, 'stop');
      return true;
    } catch (err: any) {
      console.error(`[ServiceFaultProvider] Failed to stop service ${step.target}:`, err.message);
      return false;
    }
  }

  public async recover(step: ChaosStep): Promise<boolean> {
    console.log(`[ServiceFaultProvider] Restoring service target: ${step.target}`);
    try {
      await deploymentManager.controlService(step.target, 'start');
      return true;
    } catch (err: any) {
      console.error(`[ServiceFaultProvider] Failed to start service ${step.target}:`, err.message);
      return false;
    }
  }
}
