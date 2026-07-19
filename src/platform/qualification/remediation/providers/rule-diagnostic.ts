import { IDiagnosticProvider } from '../eie';
import { RemediationRecommendation } from '../../core/types';
import { EvidenceGraph } from '../../../certification/evidence-graph';
import type { ValidationResult } from '../../../validation/types';

export class RuleDiagnosticProvider implements IDiagnosticProvider {
  public readonly name = 'Rule-Based Diagnostic Analyzer';

  public async diagnose(
    failedResults: ValidationResult[],
    graph: EvidenceGraph
  ): Promise<RemediationRecommendation[]> {
    const recs: RemediationRecommendation[] = [];

    for (const result of failedResults) {
      const logs = result.evidence.logs?.join('\n') || '';
      const message = result.message || '';
      const fullText = `${message}\n${logs}`.toLowerCase();

      // Rule 1: Port unavailability / Port collision
      if (fullText.includes('port') && (fullText.includes('unresponsive') || fullText.includes('refused') || fullText.includes('collision') || fullText.includes('4317') || fullText.includes('4000') || fullText.includes('11434'))) {
        recs.push({
          problemId: `rule-port-err-${result.id}`,
          domain: result.domain,
          probableRootCause: 'Local network port collision or unresponsive service listener (Ollama/LiteLLM/OTEL Collector).',
          estimatedImpact: 'Severe. Subsystem components are blocked from communicating, resulting in failure cascades.',
          remediationSteps: [
            'Verify all required services are running by executing the healthcheck tool: powershell -File health.bat',
            'Check for port conflicts (e.g. Jaeger OTEL collector collision on port 4317; map Jaeger receiver to 4319 as noted in improvement backlog)',
            'Restart background services: powershell -File run.bat restart'
          ],
          estimatedEffortMinutes: 15,
          confidenceScore: 0.95,
          priority: 'CRITICAL',
          status: 'OPEN'
        });
      }

      // Rule 2: Lint / Formatting / Type Checking Failures
      if (fullText.includes('eslint') || fullText.includes('tsc') || fullText.includes('typescript') || fullText.includes('syntax') || fullText.includes('linter')) {
        recs.push({
          problemId: `rule-lint-err-${result.id}`,
          domain: result.domain,
          probableRootCause: 'TypeScript compilation errors or ESLint syntax style guideline violations.',
          estimatedImpact: 'Medium. Code remains non-compliant with platform quality gates and may fail production packaging.',
          remediationSteps: [
            'Run local linter to identify exact syntax issues: npm run lint',
            'Run TypeScript check directly: npx tsc --noEmit',
            'Fix files and run tests before committing.'
          ],
          estimatedEffortMinutes: 20,
          confidenceScore: 0.90,
          priority: 'HIGH',
          status: 'OPEN'
        });
      }

      // Rule 3: DB / Prisma schema mismatch
      if (fullText.includes('prisma') || fullText.includes('sqlite') || fullText.includes('database') || fullText.includes('schema mismatch')) {
        recs.push({
          problemId: `rule-db-err-${result.id}`,
          domain: result.domain,
          probableRootCause: 'Local SQLite database out of sync with Prisma schema models.',
          estimatedImpact: 'High. Database operations, audits, or credential retrieval operations may crash.',
          remediationSteps: [
            'Synchronize the schema directly with the database: npx prisma db push',
            'Generate the Prisma client: npx prisma generate',
            'Check environment variables for DATABASE_URL consistency.'
          ],
          estimatedEffortMinutes: 10,
          confidenceScore: 0.98,
          priority: 'HIGH',
          status: 'OPEN'
        });
      }
    }

    return recs;
  }
}

export const ruleDiagnostic = new RuleDiagnosticProvider();
export default ruleDiagnostic;
