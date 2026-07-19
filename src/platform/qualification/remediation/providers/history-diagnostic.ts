import { IDiagnosticProvider } from '../eie';
import { RemediationRecommendation } from '../../core/types';
import { EvidenceGraph } from '../../../certification/evidence-graph';
import type { ValidationResult } from '../../../validation/types';
import prisma from '../../../../infrastructure/db/prisma';

export class HistoryDiagnosticProvider implements IDiagnosticProvider {
  public readonly name = 'Historical Trend Diagnostic Analyzer';

  public async diagnose(
    failedResults: ValidationResult[],
    graph: EvidenceGraph
  ): Promise<RemediationRecommendation[]> {
    const recs: RemediationRecommendation[] = [];

    try {
      // Find the most recent historical failures from SQLite database
      const pastFailures = await prisma.qualificationHistory.findMany({
        where: { decision: 'FAIL' },
        orderBy: { timestamp: 'desc' },
        take: 5
      });

      for (const result of failedResults) {
        // Look through recent history to see if a similar failure exists
        const matchedPast = pastFailures.find((pf) => 
          pf.summary && pf.summary.toLowerCase().includes(result.domain.toLowerCase())
        );

        if (matchedPast) {
          recs.push({
            problemId: `history-recurring-err-${result.domain}-${Date.now()}`,
            domain: result.domain,
            probableRootCause: `Recurring failure: This domain (${result.domain}) previously failed qualification on ${new Date(matchedPast.timestamp).toLocaleDateString()}.`,
            estimatedImpact: 'Medium. Persistent platform issue that is not being resolved by standard remediation steps.',
            remediationSteps: [
              `Check the details of historical qualification run [${matchedPast.id}].`,
              'Analyze Git logs for commits touching this domain since the first failure occurred.',
              'Escalate this domain failure to senior engineers as it represents a regression.'
            ],
            estimatedEffortMinutes: 30,
            confidenceScore: 0.80,
            priority: 'HIGH',
            status: 'OPEN'
          });
        }
      }
    } catch (err: unknown) {
      // Fallback gracefully if database table is not yet populated or accessible
      console.warn('[HistoryDiagnostic] Database analytics table query failed or empty. Skipping history lookup.', err);
    }

    return recs;
  }
}

export const historyDiagnostic = new HistoryDiagnosticProvider();
export default historyDiagnostic;
