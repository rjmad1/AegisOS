import * as fs from 'fs';
import * as path from 'path';
import { QualificationReport } from '../core/types';
import { EvidenceGraph } from '../../certification/evidence-graph';
import { scorecardRenderer } from './scorecard';
import prisma from '../../../infrastructure/db/prisma';

export class HistoricalIntelService {
  public async persistReport(report: QualificationReport, graph: EvidenceGraph): Promise<void> {
    const date = new Date(report.timestamp);
    const year = date.getUTCFullYear().toString();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');

    // 1. Setup structured artifact paths
    const outputDir = path.resolve(
      process.cwd(),
      'artifacts_storage',
      'qualification',
      year,
      month,
      report.id
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Paths
    const manifestPath = path.join(outputDir, 'manifest.json');
    const graphPath = path.join(outputDir, 'evidence_graph.json');
    const mdPath = path.join(outputDir, 'scorecard.md');
    const htmlPath = path.join(outputDir, 'scorecard.html');

    // Write file outputs
    fs.writeFileSync(manifestPath, JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(graphPath, graph.serialize(), 'utf-8');
    fs.writeFileSync(mdPath, scorecardRenderer.renderMarkdown(report), 'utf-8');
    fs.writeFileSync(htmlPath, scorecardRenderer.renderHtml(report), 'utf-8');

    console.log(`[HistoricalIntel] Saved qualification artifacts to directory: ${outputDir}`);

    // Copy to release/qualification for CLI compatibility
    const releaseDir = path.resolve(process.cwd(), 'release', 'qualification');
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }
    fs.copyFileSync(manifestPath, path.join(releaseDir, 'release_manifest.json'));
    fs.copyFileSync(graphPath, path.join(releaseDir, 'evidence_graph.json'));
    fs.copyFileSync(mdPath, path.join(releaseDir, 'production_readiness_report.md'));

    // 2. Register with Artifact registry in SQLite
    try {
      const stats = fs.statSync(manifestPath);
      await prisma.artifact.create({
        data: {
          id: report.id,
          name: `Qualification Scorecard - ${report.id}`,
          description: `Platform qualification scorecard run report for gitSha ${report.gitSha.slice(0, 8)}. Decision: ${report.decision}. Score: ${report.overallScore}%.`,
          type: 'qualification_scorecard',
          mimeType: 'application/json',
          size: stats.size,
          createdDate: date.toISOString(),
          modifiedDate: date.toISOString(),
          createdBy: 'system',
          tags: JSON.stringify(['qualification', 'scorecard', report.decision]),
          status: 'active',
          location: manifestPath,
          previewSupported: true,
          downloadSupported: true,
          deleteSupported: false,
          version: '1.0.0',
          conversationId: 'apqf-system',
          workflowId: 'qualification-pipeline',
          metadata: JSON.stringify({
            overallScore: report.overallScore,
            decision: report.decision,
            evidenceGraphRootHash: report.evidenceGraphRootHash,
          }),
          lifecycleState: 'active',
          storage: '{}',
          relationships: '[]',
          preview: '{}',
          processing: '{}',
          search: '{}'
        }
      });
      console.log(`[HistoricalIntel] Successfully registered artifact [${report.id}] in database.`);
    } catch (err: unknown) {
      console.error('[HistoricalIntel] Failed to write record to Artifact table:', err);
    }

    // 3. Project analytical metadata into SQLite read models
    try {
      // Create QualificationHistory record
      await prisma.qualificationHistory.create({
        data: {
          id: report.id,
          artifactId: report.id,
          timestamp: date,
          triggerSource: report.request.triggerSource,
          triggerReason: report.request.reason,
          decision: report.decision,
          overallScore: report.overallScore,
          durationMs: report.durationMs,
          gitSha: report.gitSha,
          platformVersion: report.platformVersion,
          environment: report.environment,
          summary: `Run completed with verdict: ${report.decision}. Overall Score: ${report.overallScore}%`
        }
      });

      // Create MaturityHistory record
      await prisma.maturityHistory.create({
        data: {
          qualificationHistoryId: report.id,
          timestamp: date,
          architecture: report.maturity.architecture,
          engineering: report.maturity.engineering,
          reliability: report.maturity.reliability,
          scalability: report.maturity.scalability,
          security: report.maturity.security,
          governance: report.maturity.governance,
          observability: report.maturity.observability,
          performance: report.maturity.performance,
          maintainability: report.maturity.maintainability,
          extensibility: report.maturity.extensibility,
          aiReadiness: report.maturity.aiReadiness,
          overall: report.overallScore
        }
      });

      // Create RemediationHistory records
      for (const rec of report.remediations) {
        await prisma.remediationHistory.create({
          data: {
            qualificationHistoryId: report.id,
            timestamp: date,
            problemId: rec.problemId,
            domain: rec.domain,
            probableRootCause: rec.probableRootCause,
            estimatedImpact: rec.estimatedImpact,
            remediationSteps: JSON.stringify(rec.remediationSteps),
            estimatedEffortMinutes: rec.estimatedEffortMinutes,
            confidenceScore: rec.confidenceScore,
            priority: rec.priority,
            status: rec.status
          }
        });
      }

      // Upsert CapabilityCertifications for capabilities executed
      for (const [providerId, result] of Object.entries(report.results)) {
        if (result.domain === 'certification' || result.domain === 'governance') continue;
        const certStatus = result.status === 'PASS' ? 'CERTIFIED' : result.status === 'WARNING' ? 'DEGRADED' : 'UNCERTIFIED';

        await prisma.capabilityCertification.upsert({
          where: { capabilityId: providerId },
          update: {
            name: result.name,
            version: '1.0.0',
            status: certStatus,
            score: result.score,
            lastCertifiedAt: date,
            constraints: JSON.stringify(result.evidence.resourceProfile || {}),
            deviations: JSON.stringify(result.evidence.logs || [])
          },
          create: {
            capabilityId: providerId,
            name: result.name,
            version: '1.0.0',
            status: certStatus,
            score: result.score,
            lastCertifiedAt: date,
            constraints: JSON.stringify(result.evidence.resourceProfile || {}),
            deviations: JSON.stringify(result.evidence.logs || [])
          }
        });
      }

      console.log(`[HistoricalIntel] Projected analytical read models for run [${report.id}] to database.`);
    } catch (err: unknown) {
      console.error('[HistoricalIntel] Failed to project analytical history models:', err);
    }
  }

  public async getHistorySummary(): Promise<any> {
    try {
      const runs = await prisma.qualificationHistory.findMany({
        orderBy: { timestamp: 'desc' },
        take: 20
      });
      return runs;
    } catch (err) {
      console.warn('[HistoricalIntel] Error fetching summary:', err);
      return [];
    }
  }
}

export const historicalIntel = new HistoricalIntelService();
export default historicalIntel;
