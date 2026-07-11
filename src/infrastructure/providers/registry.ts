import { IInfrastructureProvider, ProviderType } from "../contracts/provider";

export class ProviderRegistry {
  private static instance: ProviderRegistry | null = null;
  private providers: Map<string, IInfrastructureProvider> = new Map();

  private constructor() {}

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public registerProvider(provider: IInfrastructureProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[ProviderRegistry] Provider with ID "${provider.id}" is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
    console.log(`[ProviderRegistry] Registered provider: ${provider.name} (ID: ${provider.id}, Type: ${provider.type})`);
  }

  public getProvider<T extends IInfrastructureProvider>(id: string): T | null {
    const provider = this.providers.get(id);
    return (provider as T) || null;
  }

  public getProvidersByType<T extends IInfrastructureProvider>(type: ProviderType): T[] {
    const list: T[] = [];
    this.providers.forEach((provider) => {
      if (provider.type === type) {
        list.push(provider as T);
      }
    });
    return list;
  }

  public unregisterProvider(id: string): void {
    if (this.providers.has(id)) {
      const provider = this.providers.get(id)!;
      this.providers.delete(id);
      console.log(`[ProviderRegistry] Unregistered provider: ${provider.name} (ID: ${id})`);
    }
  }

  public clearRegistry(): void {
    this.providers.clear();
    console.log("[ProviderRegistry] Cleared all provider registrations.");
  }
}
