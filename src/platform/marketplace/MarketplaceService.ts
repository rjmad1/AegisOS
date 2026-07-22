import prisma from '../../infrastructure/db/prisma';
import { trustAuthorityService } from '../certification/TrustAuthorityService';
import { certificationSuite } from '../developer/governance/CertificationSuite';
import { extensionRuntimeService } from '../extension/ExtensionRuntimeService';
import * as fs from 'fs';
import * as path from 'path';

export interface MarketplaceSearchQuery {
  text?: string;
  type?: string;
  trustLevel?: number;
}

export class MarketplaceService {
  private static instance: MarketplaceService | null = null;
  private uploadDir: string;

  private constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads', 'marketplace');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  public static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService();
    }
    return MarketplaceService.instance;
  }

  public async search(query: MarketplaceSearchQuery): Promise<any[]> {
    const where: any = {
      type: 'marketplace-package',
      status: 'active'
    };

    const artifacts = await prisma.artifact.findMany({
      where
    });

    let items = artifacts.map((art) => {
      let meta: any = {};
      try {
        meta = JSON.parse(art.metadata);
      } catch {}

      let tagsList: string[] = [];
      try {
        tagsList = JSON.parse(art.tags);
      } catch {}

      return {
        id: art.id,
        name: art.name,
        description: art.description,
        version: art.version,
        type: meta.packageType || 'extension',
        author: art.createdBy || 'Community',
        license: meta.license || 'MIT',
        pricingType: meta.pricingType || 'free',
        price: meta.price || 0,
        signature: meta.signature || '',
        isVerified: meta.trustLevel >= 70,
        downloadCount: meta.downloadCount || 0,
        dependencies: meta.dependencies || {},
        compatibility: meta.compatibility || {},
        trustLevel: meta.trustLevel || 50,
        lifecycleState: art.lifecycleState,
        tags: tagsList
      };
    });

    if (query.text) {
      const txt = query.text.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(txt) ||
          i.description.toLowerCase().includes(txt) ||
          i.tags.some((t) => t.toLowerCase().includes(txt))
      );
    }

    if (query.type) {
      items = items.filter((i) => i.type === query.type);
    }

    if (query.trustLevel) {
      items = items.filter((i) => i.trustLevel >= query.trustLevel!);
    }

    return items;
  }

  public async getDetails(itemId: string): Promise<any | null> {
    const art = await prisma.artifact.findFirst({
      where: { id: itemId, type: 'marketplace-package', status: 'active' }
    });

    if (!art) return null;

    let meta: any = {};
    try {
      meta = JSON.parse(art.metadata);
    } catch {}

    let tagsList: string[] = [];
    try {
      tagsList = JSON.parse(art.tags);
    } catch {}

    return {
      id: art.id,
      name: art.name,
      description: art.description,
      version: art.version,
      type: meta.packageType || 'extension',
      author: art.createdBy || 'Community',
      license: meta.license || 'MIT',
      pricingType: meta.pricingType || 'free',
      price: meta.price || 0,
      signature: meta.signature || '',
      isVerified: meta.trustLevel >= 70,
      downloadCount: meta.downloadCount || 0,
      dependencies: meta.dependencies || {},
      compatibility: meta.compatibility || {},
      trustLevel: meta.trustLevel || 50,
      lifecycleState: art.lifecycleState,
      tags: tagsList,
      location: art.location
    };
  }

  public async verifySignature(manifest: any, signature: string): Promise<any> {
    const cert = certificationSuite.runCertificationScan({
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      type: manifest.type || 'plugin',
      signature,
      dependencies: manifest.dependencies,
      permissions: manifest.permissions,
      codeMock: manifest.codeMock || ''
    });

    const trustManifest = trustAuthorityService.verifyArtifactTrust(
      manifest.id,
      manifest,
      signature
    );

    return {
      passed: cert.passed,
      score: cert.score,
      trustLevel: trustManifest.trustLevel,
      issuer: trustManifest.issuer,
      issues: cert.issues
    };
  }

  public async publish(
    manifest: any,
    signature: string,
    bundleBuffer?: Buffer
  ): Promise<any> {
    const verification = await this.verifySignature(manifest, signature);

    if (!verification.passed && process.env.NODE_ENV === 'production') {
      throw new Error(`Certification Failed: ${verification.issues.join('; ')}`);
    }

    const packageId = manifest.id;
    const locationPath = path.join(this.uploadDir, `${packageId}-${manifest.version}.aegispack`);

    if (bundleBuffer) {
      fs.writeFileSync(locationPath, bundleBuffer);
    } else {
      fs.writeFileSync(locationPath, JSON.stringify(manifest, null, 2));
    }

    const metadataObj = {
      packageType: manifest.type || 'extension',
      license: manifest.license || 'MIT',
      pricingType: manifest.pricingType || 'free',
      price: manifest.price || 0,
      signature,
      dependencies: manifest.dependencies || {},
      compatibility: manifest.compatibility || { aegisos: '>=1.0.0' },
      trustLevel: verification.trustLevel,
      downloadCount: 0
    };

    // Clean up any pre-existing artifact with the same packageId to allow overwrite
    try {
      await prisma.artifact.deleteMany({
        where: { id: packageId }
      });
    } catch {}

    const art = await prisma.artifact.create({
      data: {
        id: packageId,
        name: manifest.name,
        description: manifest.description || '',
        type: 'marketplace-package',
        mimeType: 'application/zip',
        size: bundleBuffer ? bundleBuffer.length : 1024,
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        createdBy: manifest.author || 'Anonymous',
        tags: JSON.stringify(manifest.capabilities || []),
        status: 'active',
        location: locationPath,
        previewSupported: false,
        downloadSupported: true,
        deleteSupported: true,
        version: manifest.version,
        conversationId: '',
        workflowId: '',
        metadata: JSON.stringify(metadataObj),
        lifecycleState: 'active',
        storage: '{}',
        relationships: '[]',
        preview: '{}',
        processing: '{}',
        search: '{}'
      }
    });

    return {
      success: true,
      artifactId: art.id,
      verification
    };
  }

  public async install(itemId: string): Promise<any> {
    const details = await this.getDetails(itemId);
    if (!details) {
      throw new Error(`Marketplace item "${itemId}" not found.`);
    }

    const files: Record<string, string> = {
      'index.js': `
        class DynamicallyInstalledExtension {
          async initialize(context) {
            context.logger.info("Dynamically installed extension ${details.name} initialized!");
          }
          async shutdown() {
            console.log("Dynamically installed extension ${details.name} shutdown.");
          }
        }
        module.exports = DynamicallyInstalledExtension;
      `
    };

    const manifest: any = {
      id: details.id,
      name: details.name,
      version: details.version,
      author: details.author,
      description: details.description,
      dependencies: details.dependencies,
      capabilities: details.tags,
      permissions: ['*'],
      entryPoints: { main: 'index.js' },
      signature: details.signature
    };

    // Clean up pre-existing extension directory to avoid collision
    try {
      await extensionRuntimeService.uninstall(details.id);
    } catch {}

    const state = await extensionRuntimeService.install(details.id, manifest, files);

    const art = await prisma.artifact.findUnique({ where: { id: itemId } });
    if (art) {
      const meta = JSON.parse(art.metadata);
      meta.downloadCount = (meta.downloadCount || 0) + 1;
      await prisma.artifact.update({
        where: { id: itemId },
        data: { metadata: JSON.stringify(meta) }
      });
    }

    return {
      success: true,
      status: state.status,
      health: state.health,
      errorMessage: state.errorMessage
    };
  }

  public async uninstall(itemId: string): Promise<boolean> {
    try {
      await extensionRuntimeService.uninstall(itemId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Promotes a package within the federated marketplace.
   */
  public async promotePackage(itemId: string): Promise<void> {
    const art = await prisma.artifact.findFirst({
      where: { id: itemId, type: 'marketplace-package' }
    });
    if (!art) throw new Error(`Marketplace package "${itemId}" not found.`);

    let meta: any = {};
    try {
      meta = JSON.parse(art.metadata);
    } catch {}

    meta.lifecycleState = 'promoted';
    
    await prisma.artifact.update({
      where: { id: itemId },
      data: {
        lifecycleState: 'promoted',
        metadata: JSON.stringify(meta)
      }
    });
  }

  /**
   * Deprecates a package in the federated marketplace.
   */
  public async deprecatePackage(itemId: string): Promise<void> {
    const art = await prisma.artifact.findFirst({
      where: { id: itemId, type: 'marketplace-package' }
    });
    if (!art) throw new Error(`Marketplace package "${itemId}" not found.`);

    let meta: any = {};
    try {
      meta = JSON.parse(art.metadata);
    } catch {}

    meta.lifecycleState = 'deprecated';

    await prisma.artifact.update({
      where: { id: itemId },
      data: {
        lifecycleState: 'deprecated',
        metadata: JSON.stringify(meta)
      }
    });
  }

  /**
   * Recommends packages that match the capability requirements of system drift or advisories.
   */
  public async recommendPackages(advisoryCategory: string): Promise<any[]> {
    const items = await this.search({});
    // Simple tag matching based on the advisory category (e.g. security, storage, ports)
    return items.filter(item => 
      item.tags.some((t: string) => t.toLowerCase().includes(advisoryCategory.toLowerCase())) ||
      item.description.toLowerCase().includes(advisoryCategory.toLowerCase())
    );
  }
}

export const marketplaceService = MarketplaceService.getInstance();
export default marketplaceService;
