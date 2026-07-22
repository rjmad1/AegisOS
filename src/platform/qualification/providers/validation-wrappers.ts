import { IQualificationProvider, QualificationRequest } from '../core/types';
import { chaosOrchestrator } from '../../validation/chaos/orchestrator';
import { enduranceOrchestrator } from '../../validation/endurance/orchestrator';
import { scalabilityOrchestrator } from '../../validation/scalability/orchestrator';
import type { ValidationResult, ValidationDomain } from '../../validation/types';

export class ChaosQualificationProvider implements IQualificationProvider {
  public readonly providerId = 'chaos';
  public readonly supportedDomains: ValidationDomain[] = ['chaos'];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[ChaosQualificationProvider] Triggering chaos experiment "kill-ollama"...');
    return await chaosOrchestrator.execute('kill-ollama');
  }
}

export class EnduranceQualificationProvider implements IQualificationProvider {
  public readonly providerId = 'endurance';
  public readonly supportedDomains: ValidationDomain[] = ['endurance'];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[EnduranceQualificationProvider] Triggering quick endurance soak test...');
    return await enduranceOrchestrator.execute('quick');
  }
}

export class ScalabilityQualificationProvider implements IQualificationProvider {
  public readonly providerId = 'scalability';
  public readonly supportedDomains: ValidationDomain[] = ['scalability'];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[ScalabilityQualificationProvider] Triggering developer-workstation scalability sweep...');
    return await scalabilityOrchestrator.execute('developer-workstation');
  }
}

export const chaosQualProvider = new ChaosQualificationProvider();
export const enduranceQualProvider = new EnduranceQualificationProvider();
export const scalabilityQualProvider = new ScalabilityQualificationProvider();
