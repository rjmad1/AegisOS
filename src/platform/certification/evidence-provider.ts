/**
 * Qualification Evidence Provider — Uniform Evidence Contract
 *
 * Every subsystem (Benchmarking, Certification, Chaos, Endurance, Scalability,
 * Governance, Security, etc.) implements IQualificationEvidenceProvider to
 * publish immutable evidence into the Platform Qualification Framework.
 *
 * The PQF aggregates evidence without understanding subsystem internals.
 */

import type { ValidationDomain, ValidationResult } from '../validation/types';

// ---------------------------------------------------------------------------
// Evidence Category — what kind of evidence this is
// ---------------------------------------------------------------------------

export type EvidenceCategory =
  | 'architecture_fitness'
  | 'benchmark_performance'
  | 'budget_compliance'
  | 'certification_result'
  | 'chaos_result'
  | 'endurance_result'
  | 'scalability_result'
  | 'reliability_observation'
  | 'security_validation'
  | 'governance_validation'
  | 'digital_twin_consistency'
  | 'replay_validation'
  | 'platform_health'
  | 'sbom_validation'
  | 'license_compliance'
  | 'dependency_verification'
  | 'operational_runbook'
  | 'disaster_recovery'
  | 'backup_restore';

// ---------------------------------------------------------------------------
// Evidence Bundle — immutable, content-addressed evidence artifact
// ---------------------------------------------------------------------------

export interface EvidenceBundle {
  /** Unique bundle identifier */
  id: string;
  /** Evidence category for PQF routing */
  category: EvidenceCategory;
  /** Validation domain that produced this evidence */
  domain: ValidationDomain;
  /** SHA-256 of the serialized payload */
  contentHash: string;
  /** ISO timestamp of creation */
  createdAt: string;
  /** Git SHA at time of evidence generation */
  gitSha: string;
  /** Platform version */
  platformVersion: string;
  /** Generator that produced this evidence */
  generatorId: string;
  generatorVersion: string;
  /** Parent evidence hashes for chain-of-trust */
  parentHashes: string[];
  /** The actual validation result */
  result: ValidationResult;
  /** Optional path to detailed artifact files */
  artifactPaths?: string[];
}

// ---------------------------------------------------------------------------
// Provider Interface
// ---------------------------------------------------------------------------

export interface IQualificationEvidenceProvider {
  /** Unique provider identifier */
  readonly providerId: string;
  /** Categories this provider can supply evidence for */
  readonly supportedCategories: EvidenceCategory[];
  /** Collect current evidence for the specified category */
  collectEvidence(category: EvidenceCategory): Promise<EvidenceBundle | null>;
}

// ---------------------------------------------------------------------------
// Evidence Registry — aggregates all providers
// ---------------------------------------------------------------------------

export class EvidenceRegistry {
  private providers: Map<string, IQualificationEvidenceProvider> = new Map();

  public register(provider: IQualificationEvidenceProvider): void {
    if (this.providers.has(provider.providerId)) {
      console.warn(
        `[EvidenceRegistry] Provider "${provider.providerId}" already registered. Skipping.`
      );
      return;
    }
    this.providers.set(provider.providerId, provider);
  }

  public unregister(providerId: string): void {
    this.providers.delete(providerId);
  }

  public getProviders(): IQualificationEvidenceProvider[] {
    return Array.from(this.providers.values());
  }

  public getProvidersForCategory(
    category: EvidenceCategory
  ): IQualificationEvidenceProvider[] {
    return this.getProviders().filter((p) =>
      p.supportedCategories.includes(category)
    );
  }

  public async collectAll(): Promise<EvidenceBundle[]> {
    const bundles: EvidenceBundle[] = [];

    for (const provider of this.getProviders()) {
      for (const category of provider.supportedCategories) {
        try {
          const bundle = await provider.collectEvidence(category);
          if (bundle) {
            bundles.push(bundle);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[EvidenceRegistry] Failed to collect "${category}" from "${provider.providerId}": ${message}`
          );
        }
      }
    }

    return bundles;
  }

  public async collectForCategories(
    categories: EvidenceCategory[]
  ): Promise<EvidenceBundle[]> {
    const bundles: EvidenceBundle[] = [];

    for (const category of categories) {
      const providers = this.getProvidersForCategory(category);
      for (const provider of providers) {
        try {
          const bundle = await provider.collectEvidence(category);
          if (bundle) {
            bundles.push(bundle);
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(
            `[EvidenceRegistry] Failed to collect "${category}" from "${provider.providerId}": ${message}`
          );
        }
      }
    }

    return bundles;
  }
}
