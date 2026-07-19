/**
 * Renderer Registry
 * 
 * Pluggable registry for artifact renderers (Markdown, JSON, CycloneDX, etc).
 */

import { IArtifactRenderer, RenderContext, GeneratedArtifact } from './types';

export class RendererRegistry {
  private static instance: RendererRegistry | null = null;
  private renderers: Map<string, IArtifactRenderer> = new Map();

  private constructor() {}

  public static getInstance(): RendererRegistry {
    if (!RendererRegistry.instance) {
      RendererRegistry.instance = new RendererRegistry();
    }
    return RendererRegistry.instance;
  }

  public register(renderer: IArtifactRenderer): void {
    this.renderers.set(renderer.rendererId, renderer);
  }

  public unregister(rendererId: string): void {
    this.renderers.delete(rendererId);
  }

  public getRenderer(rendererId: string): IArtifactRenderer | undefined {
    return this.renderers.get(rendererId);
  }

  public getRenderers(): IArtifactRenderer[] {
    return Array.from(this.renderers.values());
  }

  /**
   * Render all artifacts for a given context across registered renderers.
   */
  public async renderAll(context: RenderContext): Promise<GeneratedArtifact[]> {
    const results: GeneratedArtifact[] = [];
    for (const renderer of this.getRenderers()) {
      if (renderer.supportedFormats.includes(context.targetFormat)) {
        try {
          const artifacts = await renderer.render(context);
          results.push(...artifacts);
        } catch (err: any) {
          console.error(`[RendererRegistry] Renderer "${renderer.rendererId}" failed:`, err.message);
        }
      }
    }
    return results;
  }
}

export const rendererRegistry = RendererRegistry.getInstance();
export default rendererRegistry;
