import { describe, it, expect } from 'vitest';
import { PlatformQualificationEvaluator } from '../../../src/platform/certification/pqf/evaluator';
import { productionReadinessProfile } from '../../../src/platform/certification/pqf/production-readiness-profile';
import { EvidenceBundle } from '../../../src/platform/certification/evidence-provider';

describe('AegisOS Production Readiness Certification', () => {
  const evaluator = new PlatformQualificationEvaluator();
  evaluator.registerProfile(productionReadinessProfile);

  const mockManifest = {
    version: '1.0.0',
    gitSha: 'test-sha',
    timestamp: new Date().toISOString(),
    componentVersions: {},
    models: [],
    capabilities: ['search-provider', 'command-provider', 'settings-provider'],
    mcpServers: [],
    sbomPath: '',
    platformHealth: {
      architecture: 95,
      performance: 95,
      reliability: 95,
      security: 95,
      maintainability: 95,
      observability: 95,
      governance: 95,
      overall: 95, // Above minimum score 90
      certification: 95
    },
    certificationTree: {
      id: 'root',
      name: 'Root',
      description: 'Root Node',
      type: 'PLATFORM' as const,
      weight: 1.0
    }
  };

  const mockEvidenceBundles: EvidenceBundle[] = [
    {
      id: 'b-chaos',
      category: 'chaos_result',
      domain: 'chaos',
      contentHash: 'hash-1',
      createdAt: new Date().toISOString(),
      gitSha: 'test-sha',
      platformVersion: '1.0.0',
      generatorId: 'chaos-gen',
      generatorVersion: '1.0.0',
      parentHashes: [],
      result: {
        id: 'res-chaos',
        name: 'Chaos Run',
        domain: 'chaos',
        status: 'PASS',
        score: 100,
        durationMs: 100,
        timestamp: new Date().toISOString(),
        evidence: { provenance: { traceId: 't', executionId: 'e', gitSha: 'g', platformVersion: 'p', timestamp: 'ts', generatorId: 'g', generatorVersion: 'v' }, contentHash: 'h' }
      }
    },
    {
      id: 'b-endurance',
      category: 'endurance_result',
      domain: 'endurance',
      contentHash: 'hash-2',
      createdAt: new Date().toISOString(),
      gitSha: 'test-sha',
      platformVersion: '1.0.0',
      generatorId: 'endurance-gen',
      generatorVersion: '1.0.0',
      parentHashes: [],
      result: {
        id: 'res-endurance',
        name: 'Endurance Run',
        domain: 'endurance',
        status: 'PASS',
        score: 100,
        durationMs: 100,
        timestamp: new Date().toISOString(),
        evidence: { provenance: { traceId: 't', executionId: 'e', gitSha: 'g', platformVersion: 'p', timestamp: 'ts', generatorId: 'g', generatorVersion: 'v' }, contentHash: 'h' }
      }
    },
    {
      id: 'b-scalability',
      category: 'scalability_result',
      domain: 'scalability',
      contentHash: 'hash-3',
      createdAt: new Date().toISOString(),
      gitSha: 'test-sha',
      platformVersion: '1.0.0',
      generatorId: 'scalability-gen',
      generatorVersion: '1.0.0',
      parentHashes: [],
      result: {
        id: 'res-scalability',
        name: 'Scalability Run',
        domain: 'scalability',
        status: 'PASS',
        score: 100,
        durationMs: 100,
        timestamp: new Date().toISOString(),
        evidence: { provenance: { traceId: 't', executionId: 'e', gitSha: 'g', platformVersion: 'p', timestamp: 'ts', generatorId: 'g', generatorVersion: 'v' }, contentHash: 'h' }
      }
    }
  ];

  it('should PASS when all required capabilities and evidence categories are present', () => {
    const report = evaluator.evaluate(mockManifest, mockEvidenceBundles);
    const result = report.profilesEvaluated['production-readiness'];
    expect(result.status).toBe('PASS');
    expect(result.missingEvidenceCategories).toHaveLength(0);
  });

  it('should FAIL when critical capabilities are missing', () => {
    const degradedManifest = {
      ...mockManifest,
      capabilities: ['settings-provider'] // missing 'search-provider' and 'command-provider'
    };
    const report = evaluator.evaluate(degradedManifest, mockEvidenceBundles);
    const result = report.profilesEvaluated['production-readiness'];
    expect(result.status).toBe('FAIL');
    expect(result.missingCapabilities).toContain('Global Search Integration');
  });

  it('should FAIL when required evidence categories are missing', () => {
    // Pass empty bundles
    const report = evaluator.evaluate(mockManifest, []);
    const result = report.profilesEvaluated['production-readiness'];
    expect(result.status).toBe('FAIL');
    expect(result.missingEvidenceCategories).toContain('chaos_result');
    expect(result.missingEvidenceCategories).toContain('endurance_result');
    expect(result.missingEvidenceCategories).toContain('scalability_result');
  });
});
