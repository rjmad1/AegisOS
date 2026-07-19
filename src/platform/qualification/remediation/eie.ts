import { RemediationRecommendation } from '../core/types';
import { EvidenceGraph } from '../../certification/evidence-graph';
import type { ValidationResult } from '../../validation/types';
import { ruleDiagnostic } from './providers/rule-diagnostic';
import { graphDiagnostic } from './providers/graph-diagnostic';
import { historyDiagnostic } from './providers/history-diagnostic';
import { llmDiagnostic } from './providers/llm-diagnostic';

export interface IDiagnosticProvider {
  readonly name: string;
  diagnose(failedResults: ValidationResult[], graph: EvidenceGraph): Promise<RemediationRecommendation[]>;
}

export class EngineeringIntelligenceEngine {
  private diagnosticProviders: IDiagnosticProvider[] = [];

  constructor() {
    // Register default diagnostic strategies
    this.diagnosticProviders.push(ruleDiagnostic);
    this.diagnosticProviders.push(graphDiagnostic);
    this.diagnosticProviders.push(historyDiagnostic);
    this.diagnosticProviders.push(llmDiagnostic);
  }

  public registerProvider(provider: IDiagnosticProvider): void {
    this.diagnosticProviders.push(provider);
  }

  public async diagnoseFailures(
    failedResults: ValidationResult[],
    graph: EvidenceGraph
  ): Promise<RemediationRecommendation[]> {
    if (failedResults.length === 0) {
      return [];
    }

    console.log(`🧠 [EIE] Initiating multi-strategy diagnostics on ${failedResults.length} failures...`);
    const recommendations: RemediationRecommendation[] = [];

    for (const provider of this.diagnosticProviders) {
      try {
        console.log(`[EIE] Running diagnostic: "${provider.name}"`);
        const recs = await provider.diagnose(failedResults, graph);
        for (const rec of recs) {
          // Prevent duplicates by checking problemId
          if (!recommendations.some((r) => r.problemId === rec.problemId)) {
            recommendations.push(rec);
          }
        }
      } catch (err: unknown) {
        console.error(`[EIE] Diagnostic provider "${provider.name}" failed:`, err);
      }
    }

    // Sort by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
    const priorityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return recommendations.sort((a, b) => {
      const wa = priorityWeights[a.priority] || 0;
      const wb = priorityWeights[b.priority] || 0;
      if (wb !== wa) return wb - wa;
      return b.confidenceScore - a.confidenceScore;
    });
  }
}

export const engineeringIntelligenceEngine = new EngineeringIntelligenceEngine();
export default engineeringIntelligenceEngine;
