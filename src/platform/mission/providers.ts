// src/platform/mission/providers.ts
// Standardised Provider Model and Registry for AegisOS EMO Subsystem

import { CanonicalAsset, TechnicalDebtItem, ArchitecturalMemory, SimulationSession, QualificationResult, EngineeringRecommendation } from './types';

export type ProviderType =
  | 'discovery'
  | 'simulation'
  | 'qualification'
  | 'reasoning'
  | 'planning'
  | 'governance'
  | 'memory'
  | 'optimization'
  | 'recommendation'
  | 'mission';

export interface IPlatformProvider {
  providerId: string;
  providerType: ProviderType;
  dependencies: string[];
  initialize?(): Promise<void>;
  shutdown?(): Promise<void>;
}

// Specialized Provider Sub-Contracts
export interface IDiscoveryProvider extends IPlatformProvider {
  providerType: 'discovery';
  discover(): Promise<CanonicalAsset[]>;
}

export interface ISimulationProvider extends IPlatformProvider {
  providerType: 'simulation';
  simulate(session: SimulationSession, delta: any): Promise<{ success: boolean; trace: string; evidenceHash: string }>;
}

export interface IQualificationProvider extends IPlatformProvider {
  providerType: 'qualification';
  execute(request: any): Promise<any>;
}

export interface IReasoningProvider extends IPlatformProvider {
  providerType: 'reasoning';
  reason(prompt: string, context: any): Promise<{ output: string; confidence: number }>;
}

export interface IPlanningProvider extends IPlatformProvider {
  providerType: 'planning';
  plan(intent: string, filePaths?: string[], context?: any): Promise<any>;
}

export interface IGovernanceProvider extends IPlatformProvider {
  providerType: 'governance';
  audit(): Promise<{ afi: number; pmi: number; findings: TechnicalDebtItem[] }>;
}

export interface IMemoryProvider extends IPlatformProvider {
  providerType: 'memory';
  saveMemory(memory: ArchitecturalMemory): Promise<void>;
  getMemories(): Promise<ArchitecturalMemory[]>;
}

export interface IOptimizationProvider extends IPlatformProvider {
  providerType: 'optimization';
  getRecommendations(): Promise<EngineeringRecommendation[]>;
}

// EMO Provider Registry for extensibility
export class EMOProviderRegistry {
  private static instance: EMOProviderRegistry | null = null;
  private providers = new Map<string, IPlatformProvider>();

  private constructor() {}

  public static getInstance(): EMOProviderRegistry {
    if (!EMOProviderRegistry.instance) {
      EMOProviderRegistry.instance = new EMOProviderRegistry();
    }
    return EMOProviderRegistry.instance;
  }

  public registerProvider(provider: IPlatformProvider): void {
    this.providers.set(provider.providerId, provider);
    console.log(`🔌 [EMO Registry] Registered ${provider.providerType} provider: ${provider.providerId}`);
  }

  public getProvider<T extends IPlatformProvider>(providerId: string): T | undefined {
    return this.providers.get(providerId) as T;
  }

  public getProvidersByType<T extends IPlatformProvider>(type: ProviderType): T[] {
    return Array.from(this.providers.values())
      .filter((p) => p.providerType === type) as T[];
  }

  public clear(): void {
    this.providers.clear();
  }
}

export const emoProviderRegistry = EMOProviderRegistry.getInstance();
export default emoProviderRegistry;
