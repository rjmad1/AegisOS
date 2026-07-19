import { IQualificationProvider } from './types';
import { chaosQualProvider, enduranceQualProvider, scalabilityQualProvider } from '../providers/validation-wrappers';
import { architectureDriftProvider } from '../providers/architecture-drift';
import { dependencyQualifierProvider } from '../providers/dependency-qualifier';
import { engineeringQualityProvider } from '../providers/engineering-quality';
import { aiRuntimeProvider } from '../providers/ai-runtime';
import { complianceRulesProvider } from '../providers/compliance-rules';

export class QualificationProviderRegistry {
  private providers: Map<string, IQualificationProvider> = new Map();

  constructor() {
    // Statically register default platform qualification providers
    this.register(chaosQualProvider);
    this.register(enduranceQualProvider);
    this.register(scalabilityQualProvider);
    this.register(architectureDriftProvider);
    this.register(dependencyQualifierProvider);
    this.register(engineeringQualityProvider);
    this.register(aiRuntimeProvider);
    this.register(complianceRulesProvider);
  }

  public register(provider: IQualificationProvider): void {
    if (this.providers.has(provider.providerId)) {
      console.warn(
        `[QualificationProviderRegistry] Provider "${provider.providerId}" already registered. Overwriting.`
      );
    }
    this.providers.set(provider.providerId, provider);
  }

  public unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getProvider(providerId: string): IQualificationProvider | undefined {
    return this.providers.get(providerId);
  }

  public getAllProviders(): IQualificationProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersForScope(scope?: string[]): IQualificationProvider[] {
    const all = this.getAllProviders();
    if (!scope || scope.length === 0) {
      return all;
    }
    // Filter by supported domains
    return all.filter((p) =>
      p.supportedDomains.some((d) => scope.includes(d))
    );
  }
}

export const qualificationProviderRegistry = new QualificationProviderRegistry();
export default qualificationProviderRegistry;
