// src/platform/pik/kernel/evolution/PlatformDiscoveryEngine.ts
import { DiscoveryProvider, CanonicalAsset } from './providers/types';
import { CodeDiscoveryProvider } from './providers/CodeDiscoveryProvider';
import { TestDiscoveryProvider } from './providers/TestDiscoveryProvider';
import { DocDiscoveryProvider } from './providers/DocDiscoveryProvider';
import { AdrDiscoveryProvider } from './providers/AdrDiscoveryProvider';
import { PrismaDiscoveryProvider } from './providers/PrismaDiscoveryProvider';
import { RuntimeDiscoveryProvider } from './providers/RuntimeDiscoveryProvider';
import { correlationEngine } from './correlation/CorrelationEngine';
import { knowledgeGraphEngine } from '../../../knowledge/KnowledgeGraphEngine';
import prisma from '../../../../infrastructure/db/prisma';

export class PlatformDiscoveryEngine {
  private static instance: PlatformDiscoveryEngine | null = null;
  private providers: DiscoveryProvider[] = [];
  private isScanning = false;

  private constructor() {
    this.registerDefaultProviders();
  }

  public static getInstance(): PlatformDiscoveryEngine {
    if (!PlatformDiscoveryEngine.instance) {
      PlatformDiscoveryEngine.instance = new PlatformDiscoveryEngine();
    }
    return PlatformDiscoveryEngine.instance;
  }

  private registerDefaultProviders(): void {
    this.providers.push(new CodeDiscoveryProvider());
    this.providers.push(new TestDiscoveryProvider());
    this.providers.push(new DocDiscoveryProvider());
    this.providers.push(new AdrDiscoveryProvider());
    this.providers.push(new PrismaDiscoveryProvider());
    this.providers.push(new RuntimeDiscoveryProvider());
  }

  /**
   * Run the full Knowledge Ingestion Pipeline (PKIP)
   */
  public async discoverAll(): Promise<{ assets: CanonicalAsset[]; relationships: any[] }> {
    if (this.isScanning) {
      throw new Error('Discovery scan is already running.');
    }
    this.isScanning = true;

    try {
      console.log('🔍 [PKIP] Initiating Platform Discovery...');
      const allAssets: CanonicalAsset[] = [];

      for (const provider of this.providers) {
        try {
          const assets = await provider.discover();
          allAssets.push(...assets);
          console.log(`[PKIP] ${provider.name} discovered ${assets.length} assets.`);
        } catch (err: any) {
          console.error(`[PKIP] Provider ${provider.name} failed:`, err.message);
        }
      }

      // Correlate assets to find semantic edges
      const relations = correlationEngine.correlate(allAssets);
      console.log(`[PKIP] Correlation Engine inferred ${relations.length} relationships.`);

      // Sync with in-memory Knowledge Graph Engine
      this.syncWithKnowledgeGraph(allAssets, relations);

      // Sync database Artifact records for ADRs and Documents to enforce dual-persistence
      await this.syncDatabaseArtifacts(allAssets, relations);

      return { assets: allAssets, relationships: relations };
    } finally {
      this.isScanning = false;
    }
  }

  private syncWithKnowledgeGraph(assets: CanonicalAsset[], relations: any[]): void {
    // 1. Add all assets as property nodes in EKG
    assets.forEach(a => {
      knowledgeGraphEngine.addNode({
        id: a.id,
        label: a.label,
        type: a.type,
        properties: a.properties,
        lineageId: a.lineageId,
        version: a.version,
        owner: a.owner,
        confidence: a.confidence,
        trustScore: a.trustScore,
        sourceReferences: a.sourceReferences
      });
    });

    // 2. Add relationships
    relations.forEach(r => {
      knowledgeGraphEngine.addRelationship(r);
    });
  }

  private async syncDatabaseArtifacts(assets: CanonicalAsset[], relations: any[]): Promise<void> {
    const syncableTypes = ['adr', 'documentation', 'code', 'test'];
    const now = new Date().toISOString();

    for (const a of assets) {
      if (!syncableTypes.includes(a.type)) continue;

      // Extract details
      const location = a.sourceReferences[0] || a.properties.path || '';
      const tags = [a.type, a.owner];
      if (a.properties.status) tags.push(a.properties.status);

      // Resolve relationships for this specific artifact
      const relatedRels = relations.filter(r => r.sourceId === a.id || r.targetId === a.id);
      const relationshipLinks = relatedRels.map(r => ({
        source: r.sourceId,
        target: r.targetId,
        type: r.type,
        provenance: r.provenance
      }));

      try {
        await prisma.artifact.upsert({
          where: { id: a.id },
          update: {
            name: a.label,
            description: a.properties.description || `Discovered ${a.type} asset: ${a.label}`,
            type: a.type,
            size: a.properties.sizeBytes || 0,
            modifiedDate: now,
            tags: JSON.stringify(tags),
            location,
            version: a.version,
            metadata: JSON.stringify(a.properties),
            relationships: JSON.stringify(relationshipLinks),
          },
          create: {
            id: a.id,
            name: a.label,
            description: a.properties.description || `Discovered ${a.type} asset: ${a.label}`,
            type: a.type,
            mimeType: a.type === 'adr' || a.type === 'documentation' ? 'text/markdown' : 'application/typescript',
            size: a.properties.sizeBytes || 0,
            createdDate: now,
            modifiedDate: now,
            createdBy: a.owner,
            tags: JSON.stringify(tags),
            status: 'active',
            location,
            previewSupported: a.type === 'adr' || a.type === 'documentation',
            downloadSupported: true,
            deleteSupported: false,
            version: a.version,
            conversationId: 'system',
            workflowId: 'system',
            metadata: JSON.stringify(a.properties),
            lifecycleState: 'active',
            storage: JSON.stringify({ provider: 'local' }),
            relationships: JSON.stringify(relationshipLinks),
            preview: '{}',
            processing: '{}',
            search: '{}'
          }
        });
      } catch (err: any) {
        console.error(`[PKIP] Failed to upsert database Artifact for ${a.id}:`, err.message);
      }
    }
  }
}

export const platformDiscoveryEngine = PlatformDiscoveryEngine.getInstance();
export default platformDiscoveryEngine;
