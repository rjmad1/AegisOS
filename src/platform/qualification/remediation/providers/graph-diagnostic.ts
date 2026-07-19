import { IDiagnosticProvider } from '../eie';
import { RemediationRecommendation } from '../../core/types';
import { EvidenceGraph } from '../../../certification/evidence-graph';
import type { ValidationResult } from '../../../validation/types';

export class GraphDiagnosticProvider implements IDiagnosticProvider {
  public readonly name = 'Evidence Graph Correlation Analyzer';

  public async diagnose(
    failedResults: ValidationResult[],
    graph: EvidenceGraph
  ): Promise<RemediationRecommendation[]> {
    const recs: RemediationRecommendation[] = [];

    // Analyze evidence graph structure to see if multiple nodes are broken
    const nodes = graph.getNodes();
    const failedDomains = failedResults.map((r) => r.domain);

    // If both chaos AND scalability failed, identify correlation
    if (failedDomains.includes('chaos') && failedDomains.includes('scalability')) {
      recs.push({
        problemId: `graph-chaos-scale-corr-${Date.now()}`,
        domain: 'chaos',
        probableRootCause: 'Cascading failure under pressure: Fault injection during high load causes scalability and performance budget failures.',
        estimatedImpact: 'Severe. The platform is vulnerable to service outages under simulated chaos fault injection when resource loaded.',
        remediationSteps: [
          'Audit the self-healing cycle timing: verify if the healing loop takes too long to execute (exceeding RTO limits) when CPU/RAM usage is high.',
          'Add rate-limit backoffs and priority queues to keep core API routes active under stress.',
          'Perform a load sweep to identify VRAM fragmentation boundaries.'
        ],
        estimatedEffortMinutes: 45,
        confidenceScore: 0.85,
        priority: 'HIGH',
        status: 'OPEN'
      });
    }

    // Correlation: Architecture drift causing capability or execution failures
    if (failedDomains.includes('architecture') && failedDomains.some((d) => d === 'certification' || d === 'governance')) {
      recs.push({
        problemId: `graph-arch-drift-corr-${Date.now()}`,
        domain: 'architecture',
        probableRootCause: 'Architectural drift or model mismatch violating release qualification criteria.',
        estimatedImpact: 'High. The platform design deviates from established ADRs, blocking certification.',
        remediationSteps: [
          'Audit recent commits for illegal layer import crossings (e.g. src/infrastructure importing app views).',
          'Review the Architecture Decision Records (ADRs) to realign boundaries.',
          'Verify capability manifests and compile with proper type bounds.'
        ],
        estimatedEffortMinutes: 30,
        confidenceScore: 0.88,
        priority: 'HIGH',
        status: 'OPEN'
      });
    }

    return recs;
  }
}

export const graphDiagnostic = new GraphDiagnosticProvider();
export default graphDiagnostic;
