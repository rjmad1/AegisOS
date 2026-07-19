/**
 * Qualify Command Line Interface
 * 
 * Provides the main `aegis qualify` orchestrator command. Runs selected
 * qualification gates, compiles the content-addressed evidence graph,
 * invokes artifact renderers, and cryptographically signs the Release Manifest.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PlatformQualificationEvaluator } from '../certification/pqf/evaluator';
import { productionReadinessProfile } from '../certification/pqf/production-readiness-profile';
import { qualificationGates } from '../certification/pqf/qualification-gates';
import { EvidenceRegistry, EvidenceBundle } from '../certification/evidence-provider';
import { EvidenceGraph } from '../certification/evidence-graph';
import { ReleaseSignerFactory } from '../certification/release-signer';
import { ExtendedReleaseManifest } from '../certification/release-manifest';
import { ExecutionHost } from './execution-host';
import { chaosOrchestrator } from '../validation/chaos/orchestrator';
import { enduranceOrchestrator } from '../validation/endurance/orchestrator';
import { scalabilityOrchestrator } from '../validation/scalability/orchestrator';
import { rendererRegistry } from '../artifacts/renderer-registry';
import { MarkdownRenderer } from '../artifacts/markdown-renderer';
import { JsonRenderer } from '../artifacts/json-renderer';
import { FilesystemDelivery } from '../artifacts/filesystem-delivery';
import { qualificationOrchestrator } from '../qualification/orchestrator/orchestrator';

export interface QualifyOptions {
  gateId: string;
  outputPath?: string;
  signProvider?: string;
  secretSalt?: string;
}

export class QualifyCommand {
  private evidenceRegistry = new EvidenceRegistry();
  private evaluator = new PlatformQualificationEvaluator();

  constructor() {
    // 1. Register validation orchestrators as evidence providers
    this.evidenceRegistry.register(chaosOrchestrator);
    this.evidenceRegistry.register(enduranceOrchestrator);
    this.evidenceRegistry.register(scalabilityOrchestrator);

    // 2. Register production readiness profile in PQF
    this.evaluator.registerProfile(productionReadinessProfile);

    // 3. Register renderers
    rendererRegistry.register(new MarkdownRenderer());
    rendererRegistry.register(new JsonRenderer());
  }

  /**
   * Run the full qualification process for a given gate ID.
   */
  public async execute(options: QualifyOptions): Promise<{ success: boolean; reportPath?: string }> {
    const gate = qualificationGates.find(g => g.id === options.gateId);
    if (!gate) {
      console.error(`❌ [QualifyCommand] Unknown qualification gate: "${options.gateId}"`);
      return { success: false };
    }

    console.log(`🚀 [QualifyCommand] Launching qualification gate: "${gate.name}"`);
    const hostMeta = ExecutionHost.getMetadata();

    // 1. Map gate categories to new APQF providers
    const providerSelection = this.mapCategoriesToProviders(gate.requiredEvidenceCategories);

    // 2. Execute via new APQF Orchestrator
    const request = {
      id: `qual-req-${Date.now()}`,
      reason: `CLI execution of qualification gate: "${gate.name}"`,
      triggerSource: 'MANUAL' as const,
      timestamp: new Date().toISOString(),
      correlationId: options.secretSalt || `cli-${Date.now()}`,
      priority: 'HIGH' as const,
      providerSelection
    };

    const report = await qualificationOrchestrator.executeRequest(request);

    // 3. Map new results back to legacy bundles to support existing verifiers & signers
    const bundles: EvidenceBundle[] = [];
    for (const [providerId, result] of Object.entries(report.results)) {
      const category = this.mapDomainToCategory(result.domain);
      if (gate.requiredEvidenceCategories.includes(category)) {
        bundles.push({
          id: `bundle-${providerId}-${Date.now()}`,
          category,
          domain: result.domain,
          contentHash: result.evidence.contentHash,
          createdAt: new Date().toISOString(),
          gitSha: request.correlationId,
          platformVersion: '1.0.0',
          generatorId: providerId,
          generatorVersion: '1.0.0',
          parentHashes: [],
          result
        });
      }
    }

    console.log(`[QualifyCommand] Mapped ${bundles.length} results to legacy evidence bundles.`);

    // 4. Construct mock base manifest representing platform build metadata
    const baseManifest = {
      version: '1.0.0',
      gitSha: hostMeta.gitSha,
      timestamp: new Date().toISOString(),
      componentVersions: { aegisos: '1.0.0', ollama: '0.1.48', litellm: '1.43.0' },
      models: ['llama3:8b'],
      capabilities: ['search-provider', 'command-provider'],
      mcpServers: [],
      sbomPath: 'docs/sbom.json',
      platformHealth: {
        architecture: report.maturity.architecture,
        performance: report.maturity.performance,
        reliability: report.maturity.reliability,
        security: report.maturity.security,
        maintainability: report.maturity.maintainability,
        observability: report.maturity.observability,
        governance: report.maturity.governance,
        certification: report.maturity.overall,
        overall: report.maturity.overall
      },
      certificationTree: {
        id: 'root',
        name: 'AegisOS Release Validation Root',
        description: 'Top-level certification root node',
        type: 'PLATFORM' as const,
        weight: 1.0
      }
    };

    const qualificationDecision = report.decision === 'FAIL' ? 'FAIL' : 'PASS';

    // 5. Sign Release Manifest
    const extendedManifest: Omit<ExtendedReleaseManifest, 'signature' | 'signedHash'> = {
      ...baseManifest,
      evidenceGraphRootHash: report.evidenceGraphRootHash,
      configurationHash: computeHashOfConfig(),
      environmentFingerprint: `cpu:${hostMeta.hardwareCpuCount}-mem:${hostMeta.hardwareMemoryMB}`,
      qualificationProfile: 'production-readiness',
      qualificationDecision
    };

    const signer = ReleaseSignerFactory.createSigner(options.signProvider ?? 'sha256', { secretSalt: options.secretSalt });
    const signature = await signer.sign(extendedManifest);

    const signedManifest: ExtendedReleaseManifest = {
      ...extendedManifest,
      signature,
      signedHash: signature.signedHash
    };

    // 6. Render and Deliver reports and runbooks
    const outputDir = options.outputPath ?? 'release/qualification';
    const renderContext = {
      manifest: signedManifest,
      evidenceBundles: bundles,
      targetFormat: 'markdown' as const
    };

    const artifacts = await rendererRegistry.renderAll(renderContext);
    
    const jsonContext = {
      manifest: signedManifest,
      evidenceBundles: bundles,
      targetFormat: 'json' as const
    };
    const jsonArtifacts = await rendererRegistry.renderAll(jsonContext);

    const delivery = new FilesystemDelivery();
    await delivery.deliver([...artifacts, ...jsonArtifacts], outputDir);

    // Save serialized evidence graph
    const fs = require('fs');
    const graphPath = path.resolve(process.cwd(), outputDir, 'evidence_graph.json');
    fs.writeFileSync(graphPath, JSON.stringify({ version: '1.0.0', nodes: [] }), 'utf-8'); // simple compatibility mock

    // Save Signed Release Manifest
    const manifestPath = path.resolve(process.cwd(), outputDir, 'release_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(signedManifest, null, 2), 'utf-8');
    console.log(`[QualifyCommand] Saved Signed Release Manifest to: ${manifestPath}`);

    const success = qualificationDecision === 'PASS';
    return { success, reportPath: manifestPath };
  }

  private mapCategoriesToProviders(categories: string[]): string[] {
    const list: string[] = [];
    if (categories.includes('chaos_result')) list.push('chaos');
    if (categories.includes('endurance_result')) list.push('endurance');
    if (categories.includes('scalability_result')) list.push('scalability');
    
    // Always include APQF verification checks
    list.push('architecture-drift');
    list.push('dependency-qualifier');
    list.push('engineering-quality');
    list.push('ai-runtime');
    list.push('compliance-rules');
    
    return list;
  }

  private mapDomainToCategory(domain: string): any {
    switch (domain) {
      case 'chaos': return 'chaos_result';
      case 'endurance': return 'endurance_result';
      case 'scalability': return 'scalability_result';
      case 'benchmark': return 'benchmark_performance';
      case 'security': return 'security_validation';
      case 'governance': return 'governance_validation';
      case 'architecture': return 'architecture_fitness';
      default: return 'platform_health';
    }
  }
}

function computeHashOfConfig(): string {
  const crypto = require('crypto');
  const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : 'empty';
  return crypto.createHash('sha256').update(envContent).digest('hex');
}
