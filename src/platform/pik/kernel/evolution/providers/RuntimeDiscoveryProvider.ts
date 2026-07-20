// src/platform/pik/kernel/evolution/providers/RuntimeDiscoveryProvider.ts
import { DiscoveryProvider, CanonicalAsset } from './types';
import { InfrastructureDiscoveryEngine } from '../../../../control-plane/InfrastructureDiscoveryEngine';
import prisma from '../../../../../infrastructure/db/prisma';

export class RuntimeDiscoveryProvider implements DiscoveryProvider {
  public get name(): string { return 'RuntimeDiscoveryProvider'; }
  private discovery = InfrastructureDiscoveryEngine.getInstance();

  public async discover(): Promise<CanonicalAsset[]> {
    const assets: CanonicalAsset[] = [];

    // 1. Fetch hardware and services from InfrastructureDiscoveryEngine
    const components = this.discovery.getAllComponents();
    for (const c of components) {
      assets.push({
        id: c.id,
        label: c.name,
        type: this.mapCategoryToType(c.category),
        properties: {
          category: c.category,
          state: c.lifecycleState,
          health: c.status,
          dependencies: c.dependencies,
          capabilities: c.capabilities,
          metadata: c.metadata || {}
        },
        lineageId: c.id,
        version: '1.0.0',
        owner: c.ownerModule || 'infrastructure',
        confidence: 1.0,
        trustScore: 1.0,
        sourceReferences: []
      });
    }

    // 2. Fetch Capabilities Certification from Database
    try {
      const certs = await prisma.capabilityCertification.findMany();
      for (const cert of certs) {
        assets.push({
          id: `capability:${cert.capabilityId}`,
          label: cert.name,
          type: 'capability',
          properties: {
            capabilityId: cert.capabilityId,
            status: cert.status,
            score: cert.score,
            lastCertifiedAt: cert.lastCertifiedAt,
            constraints: JSON.parse(cert.constraints || '{}'),
            deviations: JSON.parse(cert.deviations || '[]')
          },
          lineageId: `capability:${cert.capabilityId}`,
          version: cert.version,
          owner: 'certification-framework',
          confidence: 1.0,
          trustScore: 1.0,
          sourceReferences: []
        });
      }
    } catch (err: any) {
      console.error('[RuntimeDiscoveryProvider] Failed to fetch capability certifications:', err.message);
    }

    // 3. Fetch Workflows from Database
    try {
      const workflows = await prisma.workflow.findMany({
        where: { deletedAt: null }
      });
      for (const wf of workflows) {
        assets.push({
          id: `workflow:${wf.id}`,
          label: wf.name,
          type: 'workflow',
          properties: {
            description: wf.description,
            status: wf.status,
            nodes: JSON.parse(wf.nodes || '[]'),
            capabilities: JSON.parse(wf.capabilities || '[]'),
            dependencies: JSON.parse(wf.dependencies || '[]'),
            metadata: JSON.parse(wf.metadata || '{}')
          },
          lineageId: `workflow:${wf.id}`,
          version: wf.version,
          owner: 'workflow-engine',
          confidence: 1.0,
          trustScore: 1.0,
          sourceReferences: []
        });
      }
    } catch (err: any) {
      console.error('[RuntimeDiscoveryProvider] Failed to fetch workflows:', err.message);
    }

    return assets;
  }

  private mapCategoryToType(category: string): string {
    if (['gpu', 'cpu', 'ram', 'storage-device'].includes(category)) return 'component';
    if (['database', 'vector-store'].includes(category)) return 'database';
    if (['ai-model'].includes(category)) return 'model';
    if (['agent'].includes(category)) return 'agent';
    return 'service';
  }
}
