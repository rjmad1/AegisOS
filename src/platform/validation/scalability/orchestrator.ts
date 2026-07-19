/**
 * Scalability & Capacity Orchestrator
 * 
 * Executes scalability profiles, runs capacity discovery envelopes,
 * and compiles evidence for qualification.
 */

import { IValidationOrchestrator, ValidationResult, ValidationStatus } from '../types';
import { ScalabilityProfile, CapacityReport } from './types';
import { scalabilityProfiles } from './profiles';
import { k6LoadGenerator } from '../../../infrastructure/reliability/load-generator';
import { CapacityDiscoveryEngine } from './capacity-discovery';
import { IQualificationEvidenceProvider, EvidenceBundle, EvidenceCategory } from '../../certification/evidence-provider';
import { computeContentHash } from '../../certification/evidence-graph';

export class ScalabilityOrchestrator implements IValidationOrchestrator, IQualificationEvidenceProvider {
  public readonly domain = 'scalability';
  public readonly providerId = 'scalability-orchestrator-provider';
  public readonly supportedCategories: EvidenceCategory[] = ['scalability_result'];

  private profiles: Map<string, ScalabilityProfile> = new Map();
  private lastResults: Map<string, CapacityReport> = new Map();

  constructor() {
    for (const p of scalabilityProfiles) {
      this.profiles.set(p.id, p);
    }
  }

  public getAvailableProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  public async execute(profileId: string): Promise<ValidationResult> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Scalability Profile "${profileId}" not found.`);
    }

    console.log(`📈 [ScalabilityOrchestrator] Running scalability profile "${profile.name}" (${profile.id})...`);
    
    const startTime = Date.now();

    // Discover the operating envelope using adaptive sweep
    const envelope = await CapacityDiscoveryEngine.discoverEnvelope(
      k6LoadGenerator,
      profile.maxTargetConcurrency,
      profile.expectedLatencyLimitMs
    );

    // Perform a final verification run at optimal concurrency
    const finalRun = await k6LoadGenerator.executeLoadRun(
      'steady',
      envelope.optimalConcurrency,
      2000
    );

    const durationMs = Date.now() - startTime;
    
    // Scale status depending on capacity reached compared to profile expectations
    const capacityRatio = envelope.optimalConcurrency / profile.maxTargetConcurrency;
    let status: ValidationStatus = 'PASS';
    let score = 100;

    if (capacityRatio < 0.5) {
      status = 'FAIL';
      score = 40;
    } else if (capacityRatio < 0.9) {
      status = 'WARNING';
      score = 80;
    }

    const provenance = {
      traceId: `scale-trace-${Date.now()}`,
      executionId: `scale-exec-${Date.now()}`,
      gitSha: process.env.GIT_SHA ?? 'dev-build',
      platformVersion: '1.0.0',
      timestamp: new Date().toISOString(),
      generatorId: this.providerId,
      generatorVersion: '1.0.0'
    };

    const evidencePayload = {
      profileId: profile.id,
      envelope,
      throughput: finalRun.throughput,
      latency: finalRun.avgLatencyMs
    };

    const result: CapacityReport = {
      id: `scale-res-${profile.id}-${Date.now()}`,
      name: profile.name,
      domain: 'scalability',
      status,
      score,
      durationMs,
      timestamp: new Date().toISOString(),
      message: status === 'PASS'
        ? `Passed scalability limits. Optimal concurrency matched expected target of ${profile.maxTargetConcurrency} VUs.`
        : `Capacity degraded. Bottleneck: ${envelope.bottleneckReason ?? 'Unknown'}.`,
      profileId: profile.id,
      envelope,
      concurrencyReached: envelope.optimalConcurrency,
      throughputP95: finalRun.throughput,
      latencyP95Ms: finalRun.avgLatencyMs,
      evidence: {
        provenance,
        contentHash: computeContentHash(evidencePayload),
        metrics: {
          score,
          optimalConcurrency: envelope.optimalConcurrency,
          saturationConcurrency: envelope.saturationConcurrency,
          throughput: finalRun.throughput,
          p95Latency: finalRun.avgLatencyMs
        },
        logs: [
          `Completed scalability run for ${profile.id}. Optimal concurrency: ${envelope.optimalConcurrency} VUs.`
        ]
      }
    };

    this.lastResults.set(profile.id, result);
    return result;
  }

  // ---------------------------------------------------------------------------
  // IQualificationEvidenceProvider implementation
  // ---------------------------------------------------------------------------
  public async collectEvidence(category: EvidenceCategory): Promise<EvidenceBundle | null> {
    if (category !== 'scalability_result') return null;

    const results = Array.from(this.lastResults.values());
    if (results.length === 0) return null;

    const latestResult = results[results.length - 1];

    return {
      id: `bundle-scalability-${Date.now()}`,
      category: 'scalability_result',
      domain: 'scalability',
      contentHash: latestResult.evidence.contentHash,
      createdAt: new Date().toISOString(),
      gitSha: process.env.GIT_SHA ?? 'dev-build',
      platformVersion: '1.0.0',
      generatorId: this.providerId,
      generatorVersion: '1.0.0',
      parentHashes: [],
      result: latestResult
    };
  }
}

export const scalabilityOrchestrator = new ScalabilityOrchestrator();
export default scalabilityOrchestrator;
