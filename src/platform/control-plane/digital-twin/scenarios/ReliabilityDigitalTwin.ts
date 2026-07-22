import { EventEmitter } from 'events';

export type FailureScenarioType = 
  | 'CapacityExhaustion' 
  | 'CascadingFailure' 
  | 'NetworkPartition' 
  | 'ProviderOutage' 
  | 'SecretExpiration' 
  | 'CertificateExpiration' 
  | 'FleetFailure' 
  | 'DisasterRecovery';

export interface SimulationScenario {
  id: string;
  type: FailureScenarioType;
  targetNodes: string[]; // Node IDs in the Digital Twin
  parameters: Record<string, any>;
  durationMs: number;
}

export interface SimulationResult {
  scenarioId: string;
  status: 'completed' | 'failed' | 'aborted';
  impactedNodes: string[];
  recoveryTimeMs?: number;
  dataLossEstimates?: string;
  recommendations: string[];
}

export class ReliabilityDigitalTwin extends EventEmitter {
  private scenarios: Map<string, SimulationScenario> = new Map();
  private results: Map<string, SimulationResult> = new Map();

  constructor() {
    super();
  }

  public registerScenario(scenario: SimulationScenario): void {
    this.scenarios.set(scenario.id, scenario);
    this.emit('scenario_registered', scenario);
  }

  public async runSimulation(scenarioId: string): Promise<SimulationResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found.`);

    this.emit('simulation_started', scenario);

    // Abstract simulation logic
    const result: SimulationResult = {
      scenarioId,
      status: 'completed',
      impactedNodes: [...scenario.targetNodes, 'downstream-service-1', 'downstream-service-2'],
      recoveryTimeMs: 45000, // 45 seconds
      recommendations: [
        'Increase circuit breaker timeout for downstream-service-1',
        'Implement fallback cache for downstream-service-2'
      ]
    };

    this.results.set(scenarioId, result);
    this.emit('simulation_completed', result);
    
    return result;
  }

  public getSimulationResult(scenarioId: string): SimulationResult | undefined {
    return this.results.get(scenarioId);
  }
}
