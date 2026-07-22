import { IQualificationProvider, QualificationRequest, QualificationReport, TriggerSource } from '../core/types';
import { qualificationProviderRegistry } from '../core/registry';
import { EvidenceGraph } from '../../certification/evidence-graph';
import { ExecutionHost } from '../../commands/execution-host';
import { assessmentEngine } from '../maturity/pmi-engine';
import { engineeringIntelligenceEngine } from '../remediation/eie';
import { historicalIntel } from '../reporting/historical-intel';
import type { ValidationResult } from '../../validation/types';

export class QualificationOrchestrator {
  public async executeRequest(request: QualificationRequest): Promise<QualificationReport> {
    const startTime = Date.now();
    
    // Generate OEID if not provided
    const oeid = request.oeid || `OE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    request.oeid = oeid;
    
    console.log(`🚀 [QualificationOrchestrator] Starting qualification request: "${request.reason}" (ID: ${request.id}, OEID: ${oeid})`);

    // 1. Discover and filter providers based on request selection or scope
    let selectedProviders = request.providerSelection
      ? request.providerSelection
          .map((id) => qualificationProviderRegistry.getProvider(id))
          .filter((p): p is IQualificationProvider => !!p)
      : qualificationProviderRegistry.getProvidersForScope(request.scope);

    // 2. Sort providers topologically by their dependencies
    selectedProviders = this.sortProviders(selectedProviders);
    console.log(`[QualificationOrchestrator] Executing ${selectedProviders.length} providers in order: ${selectedProviders.map((p) => p.providerId).join(' -> ')}`);

    const results: Record<string, ValidationResult> = {};
    const warnings: string[] = [];

    // 3. Execute each provider sequentially (or parallel where dependencies are met)
    // To preserve stable ordering and dependency execution, execute sequentially
    for (const provider of selectedProviders) {
      try {
        console.log(`[QualificationOrchestrator] Running provider "${provider.providerId}"...`);
        const res = await provider.execute(request);
        results[provider.providerId] = res;
        console.log(`[QualificationOrchestrator] Provider "${provider.providerId}" completed. Score: ${res.score}, Status: ${res.status}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[QualificationOrchestrator] Provider "${provider.providerId}" failed: ${msg}`);
        warnings.push(`Provider "${provider.providerId}" crashed: ${msg}`);
      }
    }

    // 4. Construct content-addressed Evidence Graph
    const graph = new EvidenceGraph();
    for (const [providerId, result] of Object.entries(results)) {
      // Wrap result in an EvidenceBundle
      const bundle = {
        id: `bundle-${providerId}-${Date.now()}`,
        category: this.mapDomainToCategory(result.domain),
        domain: result.domain,
        contentHash: result.evidence.contentHash,
        createdAt: new Date().toISOString(),
        gitSha: request.correlationId,
        platformVersion: '1.0.0',
        generatorId: providerId,
        generatorVersion: '1.0.0',
        parentHashes: [],
        result
      };
      graph.addEvidence(bundle);
    }
    const rootHash = graph.computeRootHash();

    // 5. Evaluate Platform Assessment
    const assessment = assessmentEngine.evaluateAssessment(results);

    // 6. Diagnose failed gates & generate Autonomous Remediation Recommendations via EIE
    const failedResults = Object.values(results).filter((r) => r.status === 'FAIL');
    const remediations = await engineeringIntelligenceEngine.diagnoseFailures(failedResults, graph);

    // Determine overall decision
    let decision: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (failedResults.length > 0) {
      decision = 'FAIL';
    } else if (Object.values(results).some((r) => r.status === 'WARNING') || warnings.length > 0) {
      decision = 'WARNING';
    }

    const hostMeta = ExecutionHost.getMetadata();
    const durationMs = Date.now() - startTime;

    const report: QualificationReport = {
      id: `qual-report-${Date.now()}`,
      timestamp: new Date().toISOString(),
      request,
      decision,
      overallScore: assessment.maturity.overall,
      maturity: assessment.maturity,
      durationMs,
      gitSha: hostMeta.gitSha,
      oeid,
      platformVersion: '1.0.0',
      environment: hostMeta.hostType === 'github_actions' ? 'ENTERPRISE_PRODUCTION' : 'DEVELOPMENT',
      evidenceGraphRootHash: rootHash,
      results,
      assessment,
      remediations,
      warnings
    };

    // 7. Persist (Dual-Persistence: file registry + SQLite analytics DB)
    await historicalIntel.persistReport(report, graph);

    console.log(`[QualificationOrchestrator] Qualification finished. Decision: ${decision}. Overall Maturity Score: ${assessment.maturity.overall}%`);
    return report;
  }

  private sortProviders(providers: IQualificationProvider[]): IQualificationProvider[] {
    const sorted: IQualificationProvider[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (p: IQualificationProvider) => {
      if (temp.has(p.providerId)) {
        throw new Error(`Circular dependency detected involving provider "${p.providerId}"`);
      }
      if (!visited.has(p.providerId)) {
        temp.add(p.providerId);
        for (const depId of p.dependencies) {
          const dep = providers.find((pr) => pr.providerId === depId);
          if (dep) {
            visit(dep);
          }
        }
        temp.delete(p.providerId);
        visited.add(p.providerId);
        sorted.push(p);
      }
    };

    for (const p of providers) {
      visit(p);
    }
    return sorted;
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

export const qualificationOrchestrator = new QualificationOrchestrator();
export default qualificationOrchestrator;
