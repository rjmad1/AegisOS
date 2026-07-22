import { IProvider, ProviderType } from "../contracts/provider";

export class ProviderRegistry {
  private static instance: ProviderRegistry | null = null;
  private providers: Map<string, IProvider> = new Map();

  private constructor() {}

  public static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  public registerProvider(provider: IProvider): void {
    if (this.providers.has(provider.id)) {
      console.warn(`[ProviderRegistry] Provider with ID "${provider.id}" is already registered. Overwriting.`);
    }
    this.providers.set(provider.id, provider);
    console.log(`[ProviderRegistry] Registered provider: ${provider.name} (ID: ${provider.id}, Type: ${provider.type})`);
  }

  public getProvider<T extends IProvider>(id: string): T | null {
    const provider = this.providers.get(id);
    return (provider as T) || null;
  }

  public getAllProviders(): IProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersByType<T extends IProvider>(type: ProviderType): T[] {
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
