import { ICapabilityStorageProvider, TenantContext } from './types';

export class TenantStorageManager implements ICapabilityStorageProvider {
  private level1Provider: ICapabilityStorageProvider;
  private level2Providers = new Map<string, ICapabilityStorageProvider>();
  
  constructor(sharedProvider: ICapabilityStorageProvider) {
    this.level1Provider = sharedProvider;
  }

  public async initialize(): Promise<void> {
    await this.level1Provider.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.level1Provider.shutdown();
    for (const provider of this.level2Providers.values()) {
      await provider.shutdown();
    }
  }

  private getProviderForTenant(context: TenantContext): ICapabilityStorageProvider {
    if (context.tenantId && this.level2Providers.has(context.tenantId)) {
      return this.level2Providers.get(context.tenantId)!;
    }
    return this.level1Provider;
  }

  public registerDedicatedProvider(tenantId: string, provider: ICapabilityStorageProvider) {
    this.level2Providers.set(tenantId, provider);
  }

  public async getCapability(id: string, context: TenantContext): Promise<any> {
    return this.getProviderForTenant(context).getCapability(id, context);
  }

  public async saveCapability(capability: any, context: TenantContext): Promise<void> {
    return this.getProviderForTenant(context).saveCapability(capability, context);
  }

  public async listCapabilities(context: TenantContext): Promise<any[]> {
    return this.getProviderForTenant(context).listCapabilities(context);
  }
}
