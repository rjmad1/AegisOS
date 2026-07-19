/**
 * Fault Provider Registry
 * 
 * Manages the registration and discovery of pluggable fault providers.
 */

import { IChaosFaultProvider, ChaosFaultCategory } from './types';

export class FaultProviderRegistry {
  private static instance: FaultProviderRegistry | null = null;
  private providers: Map<string, IChaosFaultProvider> = new Map();

  private constructor() {}

  public static getInstance(): FaultProviderRegistry {
    if (!FaultProviderRegistry.instance) {
      FaultProviderRegistry.instance = new FaultProviderRegistry();
    }
    return FaultProviderRegistry.instance;
  }

  public register(provider: IChaosFaultProvider): void {
    if (this.providers.has(provider.providerId)) {
      console.warn(`[FaultProviderRegistry] Provider "${provider.providerId}" already registered.`);
      return;
    }
    this.providers.set(provider.providerId, provider);
  }

  public unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getProvider(providerId: string): IChaosFaultProvider | undefined {
    return this.providers.get(providerId);
  }

  public getProviders(): IChaosFaultProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersForCategory(category: ChaosFaultCategory): IChaosFaultProvider[] {
    return this.getProviders().filter(p => p.supportedCategories.includes(category));
  }
}

export const faultProviderRegistry = FaultProviderRegistry.getInstance();
export default faultProviderRegistry;
