// src/platform/mission/registry.ts
// EMO Extensibility and Plugin Framework Registry

import { IPlatformProvider, emoProviderRegistry } from './providers';

export interface IMissionPolicy {
  policyId: string;
  evaluate(mission: any): Promise<{ allowed: boolean; reason?: string }>;
}

export interface IMissionValidator {
  validatorId: string;
  validate(mission: any): Promise<{ valid: boolean; errors: string[] }>;
}

export interface IMissionSimulator {
  simulatorId: string;
  simulate(mission: any): Promise<{ success: boolean; trace: string }>;
}

export interface IMissionExecutor {
  executorId: string;
  execute(mission: any): Promise<{ success: boolean; error?: string }>;
}

export interface IMissionReport {
  reportId: string;
  generate(mission: any): Promise<any>;
}

export interface IMissionPlugin {
  pluginId: string;
  missionTypes?: string[];
  providers?: IPlatformProvider[];
  policies?: IMissionPolicy[];
  validators?: IMissionValidator[];
  simulators?: IMissionSimulator[];
  executors?: IMissionExecutor[];
  reports?: IMissionReport[];
}

export class MissionRegistry {
  private static instance: MissionRegistry | null = null;

  private plugins = new Map<string, IMissionPlugin>();
  private customMissionTypes = new Set<string>();
  private policies = new Map<string, IMissionPolicy>();
  private validators = new Map<string, IMissionValidator>();
  private simulators = new Map<string, IMissionSimulator>();
  private executors = new Map<string, IMissionExecutor>();
  private reports = new Map<string, IMissionReport>();

  private constructor() {}

  public static getInstance(): MissionRegistry {
    if (!MissionRegistry.instance) {
      MissionRegistry.instance = new MissionRegistry();
    }
    return MissionRegistry.instance;
  }

  /**
   * Registers an external mission plugin dynamically contributing to EMO capability layers.
   */
  public registerPlugin(plugin: IMissionPlugin): void {
    this.plugins.set(plugin.pluginId, plugin);
    console.log(`🔌 [EMO Plugin Framework] Loading plugin: ${plugin.pluginId}...`);

    if (plugin.missionTypes) {
      plugin.missionTypes.forEach(t => {
        this.customMissionTypes.add(t);
        console.log(`  └─ Contributed Mission Type: ${t}`);
      });
    }

    if (plugin.providers) {
      plugin.providers.forEach(p => {
        emoProviderRegistry.registerProvider(p);
      });
    }

    if (plugin.policies) {
      plugin.policies.forEach(p => {
        this.policies.set(p.policyId, p);
        console.log(`  └─ Registered Mission Policy: ${p.policyId}`);
      });
    }

    if (plugin.validators) {
      plugin.validators.forEach(v => {
        this.validators.set(v.validatorId, v);
        console.log(`  └─ Registered Mission Validator: ${v.validatorId}`);
      });
    }

    if (plugin.simulators) {
      plugin.simulators.forEach(s => {
        this.simulators.set(s.simulatorId, s);
        console.log(`  └─ Registered Mission Simulator: ${s.simulatorId}`);
      });
    }

    if (plugin.executors) {
      plugin.executors.forEach(e => {
        this.executors.set(e.executorId, e);
        console.log(`  └─ Registered Mission Executor: ${e.executorId}`);
      });
    }

    if (plugin.reports) {
      plugin.reports.forEach(r => {
        this.reports.set(r.reportId, r);
        console.log(`  └─ Registered Mission Report: ${r.reportId}`);
      });
    }
  }

  public getPlugin(pluginId: string): IMissionPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  public getCustomMissionTypes(): string[] {
    return Array.from(this.customMissionTypes);
  }

  public getPolicies(): IMissionPolicy[] {
    return Array.from(this.policies.values());
  }

  public getValidators(): IMissionValidator[] {
    return Array.from(this.validators.values());
  }

  public getSimulators(): IMissionSimulator[] {
    return Array.from(this.simulators.values());
  }

  public getExecutors(): IMissionExecutor[] {
    return Array.from(this.executors.values());
  }

  public getReports(): IMissionReport[] {
    return Array.from(this.reports.values());
  }

  public clear(): void {
    this.plugins.clear();
    this.customMissionTypes.clear();
    this.policies.clear();
    this.validators.clear();
    this.simulators.clear();
    this.executors.clear();
    this.reports.clear();
  }
}

export const missionRegistry = MissionRegistry.getInstance();
export default missionRegistry;
