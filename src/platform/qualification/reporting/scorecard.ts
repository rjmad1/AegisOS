import { QualificationReport } from '../core/types';

export class ScorecardRenderer {
  public renderMarkdown(report: QualificationReport): string {
    const decColor = report.decision === 'PASS' ? '🟢 PASS' : report.decision === 'WARNING' ? '🟡 WARNING' : '🔴 FAIL';

    let md = `# AegisOS Platform Qualification Executive Scorecard

| Metric | Value |
| --- | --- |
| **Report ID** | \`${report.id}\` |
| **Timestamp** | ${report.timestamp} |
| **Decision** | **${decColor}** |
| **Overall Maturity Score** | **${report.overallScore}%** |
| **Duration** | ${report.durationMs}ms |
| **Git SHA** | \`${report.gitSha.slice(0, 8)}\` |
| **Platform Version** | ${report.platformVersion} |
| **Environment** | ${report.environment} |
| **Evidence Root Hash** | \`${report.evidenceGraphRootHash.slice(0, 12)}...\` |

---

## 1. Platform Maturity Index (PMI)

| Maturity Domain | Score | Rating |
| --- | --- | --- |
| **Architecture Fitness** | ${report.maturity.architecture}% | ${this.getRating(report.maturity.architecture)} |
| **Engineering Quality** | ${report.maturity.engineering}% | ${this.getRating(report.maturity.engineering)} |
| **Reliability Engineering** | ${report.maturity.reliability}% | ${this.getRating(report.maturity.reliability)} |
| **Scalability** | ${report.maturity.scalability}% | ${this.getRating(report.maturity.scalability)} |
| **Security Posture** | ${report.maturity.security}% | ${this.getRating(report.maturity.security)} |
| **Governance Maturity** | ${report.maturity.governance}% | ${this.getRating(report.maturity.governance)} |
| **Observability** | ${report.maturity.observability}% | ${this.getRating(report.maturity.observability)} |
| **Performance Budgets** | ${report.maturity.performance}% | ${this.getRating(report.maturity.performance)} |
| **Maintainability** | ${report.maturity.maintainability}% | ${this.getRating(report.maturity.maintainability)} |
| **Extensibility** | ${report.maturity.extensibility}% | ${this.getRating(report.maturity.extensibility)} |
| **AI Readiness** | ${report.maturity.aiReadiness}% | ${this.getRating(report.maturity.aiReadiness)} |
| **OVERALL PLATFORM PMI** | **${report.overallScore}%** | **${this.getRating(report.overallScore)}** |

---

## 2. Qualification Provider Verdicts

| Subsystem Domain | Provider ID | Status | Score | Message |
| --- | --- | --- | --- | --- |
`;

    for (const [providerId, result] of Object.entries(report.results)) {
      const statusIcon = result.status === 'PASS' ? '🟢' : result.status === 'WARNING' ? '🟡' : '🔴';
      md += `| **${result.domain.toUpperCase()}** | ${providerId} | ${statusIcon} ${result.status} | ${result.score}% | ${result.message || 'No description'} |\n`;
    }

    md += `
---

## 3. Autonomous Remediation Recommendations (EIE)

`;

    if (report.remediations.length === 0) {
      md += `*✨ Zero failures or warnings detected. The platform is running in perfect conformance.*`;
    } else {
      md += `The Engineering Intelligence Engine (EIE) has synthesized the following prioritized remediation plan:

`;
      for (const rec of report.remediations) {
        md += `### [Priority: ${rec.priority}] ${rec.probableRootCause}
- **Domain**: \`${rec.domain}\`
- **Estimated Impact**: ${rec.estimatedImpact}
- **Remediation Steps**:
${rec.remediationSteps.map((step) => `  1. ${step}`).join('\n')}
- **Confidence Score**: ${(rec.confidenceScore * 100).toFixed(0)}%
- **Estimated Effort**: ${rec.estimatedEffortMinutes} minutes
- **Status**: \`${rec.status}\`

`;
      }
    }

    return md;
  }

  public renderHtml(report: QualificationReport): string {
    const decClass = report.decision.toLowerCase();
    const md = this.renderMarkdown(report);

    // Simple styling for premium glassmorphic dark theme
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AegisOS Executive Platform Scorecard</title>
  <style>
    body {
      font-family: 'Outfit', 'Inter', sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 2rem;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    h1, h2, h3 {
      color: #38bdf8;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 0.5rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    th, td {
      padding: 10px 15px;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    th {
      background: rgba(56, 189, 248, 0.1);
      color: #38bdf8;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 0.85rem;
    }
    .badge-pass { background: #16a34a; color: white; }
    .badge-warning { background: #ca8a04; color: white; }
    .badge-fail { background: #dc2626; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>AegisOS Qualification Scorecard</h1>
    <div style="font-size: 1.2rem; margin-bottom: 1.5rem;">
      Overall Status: <span class="badge badge-${decClass}">${report.decision}</span> | Overall Score: <strong>${report.overallScore}%</strong>
    </div>
    <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px; font-family: monospace; white-space: pre-wrap;">
${md}
    </div>
  </div>
</body>
</html>`;
  }

  private getRating(score: number): string {
    if (score >= 95) return '👑 Tier-1 Enterprise';
    if (score >= 90) return '💪 Production Ready';
    if (score >= 80) return '⚠️ Stable (Minor Debt)';
    return '❌ Degraded';
  }
}

export const scorecardRenderer = new ScorecardRenderer();
export default scorecardRenderer;
