import { BaseAgent, AgentContext } from '@platform/agents-core';
import { ValidationReport, DefectRecord } from '@platform/shared-contracts';

export interface ValidatorInput {
  report: ValidationReport;
  url: string;
}

export class ValidatorAgent extends BaseAgent<ValidatorInput, DefectRecord | null> {
  name = 'ValidatorAgent';

  protected buildPrompt(input: ValidatorInput, context: AgentContext): string {
    const violationSummary = input.report.violations
      .map((v) => `[${v.validator}] (${v.severity}) ${v.summary}`)
      .join('\n');

    return `
You are the Principal QA Failure Analyst.
Target URL: ${input.url}
Validation Violations:
${violationSummary}

Analyze these deterministic validation failures. Explain the root cause in business terms and provide a concise summary.
Return JSON:
{
  "severity": "critical",
  "summary": "...",
  "explanation": "..."
}
    `.trim();
  }

  protected parseResponse(llmResponse: string): DefectRecord | null {
    try {
      const parsed = JSON.parse(llmResponse);
      return {
        defectId: `def-${Date.now()}`,
        sessionId: '',
        nodeId: '',
        severity: parsed.severity || 'moderate',
        validatorType: 'suite',
        summary: parsed.summary || 'Validation Failure',
        explanation: parsed.explanation || 'Analyzed failure in test execution.',
        reproductionScript: '',
        createdAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  protected fallback(input: ValidatorInput, error: Error): DefectRecord | null {
    if (!input.report.passed && input.report.violations.length > 0) {
      const v = input.report.violations[0];
      return {
        defectId: `def-fallback-${Date.now()}`,
        sessionId: '',
        nodeId: input.report.nodeId,
        severity: v.severity,
        validatorType: v.validator,
        summary: v.summary,
        explanation: 'Deterministic validation failed.',
        reproductionScript: '',
        createdAt: new Date().toISOString(),
      };
    }
    return null;
  }
}
