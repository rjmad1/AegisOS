/**
 * Artifact Generation Framework (EDAGF) Types
 * 
 * Defines the core types and interfaces for the Evidence-Driven
 * Artifact Generation Framework. Structured evidence is the single source
 * of truth; documents are deterministic projections.
 */

import type { EvidenceBundle } from '../certification/evidence-provider';
import type { ExtendedReleaseManifest } from '../certification/release-manifest';

export type RenderFormat = 'markdown' | 'json' | 'html' | 'cyclonedx' | 'spdx';

export interface RenderContext {
  manifest: ExtendedReleaseManifest;
  evidenceBundles: EvidenceBundle[];
  targetFormat: RenderFormat;
  options?: Record<string, any>;
}

export interface GeneratedArtifact {
  fileName: string;
  format: RenderFormat;
  content: string | Buffer;
  hash: string;
  generatedAt: string;
}

export interface IArtifactRenderer {
  readonly rendererId: string;
  readonly supportedFormats: RenderFormat[];
  render(context: RenderContext): Promise<GeneratedArtifact[]>;
}

export interface IArtifactDeliveryProvider {
  readonly deliveryId: string;
  deliver(artifacts: GeneratedArtifact[], destination: string): Promise<Record<string, string>>;
}
