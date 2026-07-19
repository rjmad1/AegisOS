/**
 * JSON Renderer
 * 
 * Generates canonical, machine-readable JSON artifacts containing
 * the complete structured evidence. This is the platform's system of record.
 */

import { createHash } from 'crypto';
import type { IArtifactRenderer, RenderContext, GeneratedArtifact } from './types';

export class JsonRenderer implements IArtifactRenderer {
  public readonly rendererId = 'json-renderer';
  public readonly supportedFormats = ['json' as const];

  public async render(context: RenderContext): Promise<GeneratedArtifact[]> {
    const { manifest, evidenceBundles } = context;
    const artifacts: GeneratedArtifact[] = [];

    // Compile everything into a unified validation evidence payload
    const unifiedPayload = {
      manifest,
      evidenceBundles: evidenceBundles.map(b => ({
        id: b.id,
        category: b.category,
        domain: b.domain,
        contentHash: b.contentHash,
        createdAt: b.createdAt,
        gitSha: b.gitSha,
        result: {
          id: b.result.id,
          name: b.result.name,
          domain: b.result.domain,
          status: b.result.status,
          score: b.result.score,
          durationMs: b.result.durationMs,
          timestamp: b.result.timestamp,
          message: b.result.message,
          evidence: {
            provenance: b.result.evidence.provenance,
            contentHash: b.result.evidence.contentHash,
            metrics: b.result.evidence.metrics,
            resourceProfile: b.result.evidence.resourceProfile
          }
        }
      }))
    };

    const jsonString = JSON.stringify(unifiedPayload, null, 2);

    artifacts.push({
      fileName: 'qualification_evidence_bundle.json',
      format: 'json',
      content: jsonString,
      hash: createHash('sha256').update(jsonString).digest('hex'),
      generatedAt: new Date().toISOString()
    });

    return artifacts;
  }
}
