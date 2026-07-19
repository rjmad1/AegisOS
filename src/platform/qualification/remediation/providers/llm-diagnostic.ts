import { IDiagnosticProvider } from '../eie';
import { RemediationRecommendation } from '../../core/types';
import { EvidenceGraph } from '../../../certification/evidence-graph';
import type { ValidationResult } from '../../../validation/types';

export class LlmDiagnosticProvider implements IDiagnosticProvider {
  public readonly name = 'LLM-Augmented Reasoning Advisor';

  public async diagnose(
    failedResults: ValidationResult[],
    graph: EvidenceGraph
  ): Promise<RemediationRecommendation[]> {
    const recs: RemediationRecommendation[] = [];

    // Check if we should call the model
    // In test env, skip LLM calls to keep tests fast and avoid external environment dependencies
    if (process.env.NODE_ENV === 'test') {
      return this.generateHeuristicFallbacks(failedResults);
    }

    try {
      // Simple fetch check to Ollama
      const testRes = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(1000) });
      if (!testRes.ok) {
        return this.generateHeuristicFallbacks(failedResults);
      }

      for (const result of failedResults) {
        const prompt = `You are the AegisOS Engineering Intelligence Engine (EIE).
A qualification gate has failed for the domain: "${result.domain}".
Failure details: "${result.message || 'No description provided'}"
Logs/metrics: "${JSON.stringify(result.evidence.metrics || {})}"

Analyze this issue and return a JSON object with the following fields:
{
  "probableRootCause": "Brief analysis",
  "estimatedImpact": "Impact analysis",
  "remediationSteps": ["Step 1", "Step 2"],
  "estimatedEffortMinutes": 20,
  "confidenceScore": 0.85,
  "priority": "HIGH"
}`;

        const response = await fetch('http://127.0.0.1:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'smollm:135m', // fast local model
            prompt,
            stream: false,
            format: 'json'
          })
        });

        if (response.ok) {
          const body = await response.json();
          const parsed = JSON.parse(body.response);
          recs.push({
            problemId: `llm-diag-${result.id}`,
            domain: result.domain,
            probableRootCause: parsed.probableRootCause || 'LLM analyzed failure.',
            estimatedImpact: parsed.estimatedImpact || 'High operational impact.',
            remediationSteps: parsed.remediationSteps || ['Audit logs and rerun qualification.'],
            estimatedEffortMinutes: parsed.estimatedEffortMinutes || 30,
            confidenceScore: parsed.confidenceScore || 0.80,
            priority: parsed.priority || 'MEDIUM',
            status: 'OPEN'
          });
        } else {
          recs.push(...this.generateHeuristicFallbacks([result]));
        }
      }
    } catch (err: unknown) {
      console.warn('[LlmDiagnostic] Local model endpoint unreachable, falling back to heuristics.');
      return this.generateHeuristicFallbacks(failedResults);
    }

    return recs;
  }

  private generateHeuristicFallbacks(failedResults: ValidationResult[]): RemediationRecommendation[] {
    const recs: RemediationRecommendation[] = [];

    for (const result of failedResults) {
      recs.push({
        problemId: `llm-fallback-${result.id}`,
        domain: result.domain,
        probableRootCause: `Autonomous analysis of domain "${result.domain}" failure.`,
        estimatedImpact: 'Operational degradation of the affected domain capability.',
        remediationSteps: [
          `Inspect the detailed logs generated during the "${result.name}" qualification run.`,
          `Rerun validation provider manually: aegis qualify --gateId pr-gate`,
          'Review the platform health checks and verify port configurations.'
        ],
        estimatedEffortMinutes: 30,
        confidenceScore: 0.75,
        priority: 'MEDIUM',
        status: 'OPEN'
      });
    }

    return recs;
  }
}

export const llmDiagnostic = new LlmDiagnosticProvider();
export default llmDiagnostic;
