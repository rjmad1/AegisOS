/**
 * Markdown Renderer
 * 
 * Generates human-readable markdown reports and runbooks from structured evidence.
 */

import { createHash } from 'crypto';
import type { IArtifactRenderer, RenderContext, GeneratedArtifact } from './types';

export class MarkdownRenderer implements IArtifactRenderer {
  public readonly rendererId = 'markdown-renderer';
  public readonly supportedFormats = ['markdown' as const];

  public async render(context: RenderContext): Promise<GeneratedArtifact[]> {
    const { manifest, evidenceBundles } = context;
    const artifacts: GeneratedArtifact[] = [];

    // 1. Production Readiness Report
    const readinessContent = this.renderReadinessReport(manifest, evidenceBundles);
    artifacts.push({
      fileName: 'production_readiness_report.md',
      format: 'markdown',
      content: readinessContent,
      hash: createHash('sha256').update(readinessContent).digest('hex'),
      generatedAt: new Date().toISOString()
    });

    // 2. Chaos Report
    const chaosContent = this.renderChaosReport(evidenceBundles);
    artifacts.push({
      fileName: 'chaos_report.md',
      format: 'markdown',
      content: chaosContent,
      hash: createHash('sha256').update(chaosContent).digest('hex'),
      generatedAt: new Date().toISOString()
    });

    // 3. Endurance Report
    const enduranceContent = this.renderEnduranceReport(evidenceBundles);
    artifacts.push({
      fileName: 'endurance_report.md',
      format: 'markdown',
      content: enduranceContent,
      hash: createHash('sha256').update(enduranceContent).digest('hex'),
      generatedAt: new Date().toISOString()
    });

    // 4. Scalability Report
    const scalabilityContent = this.renderScalabilityReport(evidenceBundles);
    artifacts.push({
      fileName: 'scalability_report.md',
      format: 'markdown',
      content: scalabilityContent,
      hash: createHash('sha256').update(scalabilityContent).digest('hex'),
      generatedAt: new Date().toISOString()
    });

    return artifacts;
  }

  private renderReadinessReport(manifest: any, bundles: any[]): string {
    return `# AegisOS Production Readiness Report
**Manifest Version:** ${manifest.version}
**Timestamp:** ${manifest.timestamp}
**Git SHA:** ${manifest.gitSha}
**Qualification Decision:** **${manifest.qualificationDecision}**

## Platform Health Index
- **Overall Score:** ${manifest.platformHealth?.overall ?? 'N/A'}/100
- Architecture: ${manifest.platformHealth?.architecture ?? 'N/A'}
- Performance: ${manifest.platformHealth?.performance ?? 'N/A'}
- Reliability: ${manifest.platformHealth?.reliability ?? 'N/A'}
- Security: ${manifest.platformHealth?.security ?? 'N/A'}
- Maintainability: ${manifest.platformHealth?.maintainability ?? 'N/A'}
- Observability: ${manifest.platformHealth?.observability ?? 'N/A'}
- Governance: ${manifest.platformHealth?.governance ?? 'N/A'}

## Evidence Graph root hash
\`${manifest.evidenceGraphRootHash}\`

## Executive Summary
This report aggregates the automated evidence gathered for AegisOS Production Readiness Certification. All validation checks have been evaluated against strict qualification profile policies.
`;
  }

  private renderChaosReport(bundles: any[]): string {
    const chaosBundles = bundles.filter((b: any) => b.domain === 'chaos');
    let content = `# AegisOS Chaos Engineering Resilience Report
**Total Experiments Run:** ${chaosBundles.length}

| Experiment | Status | Score | Target Component | Duration |
|------------|--------|-------|------------------|----------|
`;
    for (const b of chaosBundles) {
      const res = b.result;
      content += `| ${res.name} | **${res.status}** | ${res.score} | ${res.evidence?.provenance?.generatorId ?? 'Unknown'} | ${res.durationMs}ms |\n`;
    }
    return content;
  }

  private renderEnduranceReport(bundles: any[]): string {
    const enduranceBundles = bundles.filter((b: any) => b.domain === 'endurance');
    let content = `# AegisOS Long-Duration Stability Report
**Total Endurance Checks:** ${enduranceBundles.length}

| Check Name | Status | Duration | Metrics / Observations |
|------------|--------|----------|------------------------|
`;
    for (const b of enduranceBundles) {
      const res = b.result;
      const metricsText = res.evidence?.metrics 
        ? Object.entries(res.evidence.metrics).map(([k, v]) => `${k}: ${v}`).join(', ')
        : 'None';
      content += `| ${res.name} | **${res.status}** | ${res.durationMs}ms | ${metricsText} |\n`;
    }
    return content;
  }

  private renderScalabilityReport(bundles: any[]): string {
    const scaleBundles = bundles.filter((b: any) => b.domain === 'scalability');
    let content = `# AegisOS Scalability & Capacity Report
**Total Scalability Profiles Evaluated:** ${scaleBundles.length}

| Profile | Status | Score | Throughput | Peak Latency |
|---------|--------|-------|------------|--------------|
`;
    for (const b of scaleBundles) {
      const res = b.result;
      const throughput = res.evidence?.metrics?.throughput ?? 'N/A';
      const latency = res.evidence?.metrics?.p95Latency ?? 'N/A';
      content += `| ${res.name} | **${res.status}** | ${res.score} | ${throughput} req/s | ${latency}ms |\n`;
    }
    return content;
  }
}
