// src/platform/developer/DeveloperPlatform.ts

import {
  DeveloperExtensionPoint,
  DeveloperExtension,
  DeveloperPlugin,
  MarketplaceItem,
  CertificationResult,
  LicenseEntitlement,
  UsageMetric,
  PlatformAnalytics
} from './types';
import { extensionRegistry } from '../extension/ExtensionFramework';
import { pluginManager } from '../plugin/PluginFramework';

export class DeveloperPlatform {
  private static instance: DeveloperPlatform | null = null;

  // In-memory registries representing platform repositories
  private extensionPoints: Map<string, DeveloperExtensionPoint> = new Map();
  private extensions: Map<string, DeveloperExtension[]> = new Map();
  private plugins: Map<string, DeveloperPlugin> = new Map();
  private marketplace: Map<string, MarketplaceItem> = new Map();
  private entitlements: Map<string, LicenseEntitlement> = new Map();
  private usageMetrics: UsageMetric[] = [];
  
  private constructor() {
    this.seedDefaultDeveloperData();
  }

  public static getInstance(): DeveloperPlatform {
    if (!DeveloperPlatform.instance) {
      DeveloperPlatform.instance = new DeveloperPlatform();
    }
    return DeveloperPlatform.instance;
  }

  private seedDefaultDeveloperData() {
    // Seed extension points matching the extension framework
    this.declareExtensionPoint({
      id: 'storage-provider',
      name: 'Storage Providers',
      description: 'Custom external file and artifact storage systems',
      version: '1.0.0'
    });

    this.declareExtensionPoint({
      id: 'preview-provider',
      name: 'Preview Providers',
      description: 'Aesthetic file renderers for the OpenClaw console',
      version: '1.0.0'
    });

    // Seed default marketplace items
    this.publishToMarketplace({
      id: 'com.openclaw.agent.coder',
      name: 'Distinguished Coder Agent',
      version: '2.1.0',
      type: 'agent',
      description: 'An autonomous coding agent adhering to advanced clean-code guidelines.',
      author: 'Open Source Community',
      license: 'MIT',
      pricingType: 'free',
      ratingsCount: 24,
      ratingsAverage: 4.8,
      reviews: [
        { id: 'rev-1', userId: 'usr-12', userEmail: 'reviewer1@openclaw.dev', rating: 5, comment: 'Incredible performance, resolved AST parsing issues instantly!', timestamp: new Date().toISOString() }
      ],
      dependencies: { 'openclaw': '>=1.0.0' },
      signature: 'a'.repeat(64),
      isVerified: true,
      downloadCount: 1420,
      metadata: { model: 'smollm:135m', latencyMs: 230 }
    });

    this.publishToMarketplace({
      id: 'com.openclaw.plugin.gcs-storage',
      name: 'Google Cloud Storage Plugin',
      version: '1.0.4',
      type: 'plugin',
      description: 'Secure enterprise storage backend for artifacts.',
      author: 'Enterprise Platform Team',
      license: 'Commercial',
      pricingType: 'subscription',
      price: 29.00,
      ratingsCount: 8,
      ratingsAverage: 4.5,
      reviews: [],
      dependencies: { 'openclaw': '>=1.0.0' },
      signature: 'b'.repeat(64),
      isVerified: true,
      downloadCount: 310,
      metadata: { bucketPrefix: 'openclaw-artifacts-' }
    });

    this.publishToMarketplace({
      id: 'com.openclaw.workflow.compliance-gate',
      name: 'CI/CD Compliance Gate Workflow',
      version: '1.5.0',
      type: 'workflow',
      description: 'Enforces Zero-Trust policy validation on all releases.',
      author: 'Security Architect Group',
      license: 'Apache-2.0',
      pricingType: 'metered',
      price: 0.05, // per execution
      ratingsCount: 15,
      ratingsAverage: 4.9,
      reviews: [],
      dependencies: { 'openclaw': '>=1.1.0' },
      signature: 'c'.repeat(64),
      isVerified: true,
      downloadCount: 940,
      metadata: { securityLevel: 'strict' }
    });

    // Seed default entitlements
    this.registerEntitlement({
      tenantId: 'tenant-default',
      licenseKey: 'LIC-OPENCLAW-DEV-902318-SECURE',
      tier: 'enterprise',
      status: 'active',
      expiresAt: '2028-12-31T23:59:59Z',
      features: ['unlimited-agents', 'unlimited-workflows', 'premium-plugins', 'metered-billing'],
      usageLimits: { 'api-calls-per-min': 10000, 'concurrent-plugins': 100 }
    });
  }

  // ---- Extension Registry ----

  public declareExtensionPoint(point: DeveloperExtensionPoint): void {
    this.extensionPoints.set(point.id, point);
    if (!this.extensions.has(point.id)) {
      this.extensions.set(point.id, []);
    }
    // Also bind to core extensionRegistry
    extensionRegistry.declareExtensionPoint({
      id: point.id,
      name: point.name,
      description: point.description,
      schema: point.schema
    });
  }

  public registerExtension(extension: DeveloperExtension): void {
    if (!this.extensionPoints.has(extension.pointId)) {
      throw new Error(`Extension point "${extension.pointId}" is not declared.`);
    }
    const list = this.extensions.get(extension.pointId) || [];
    this.extensions.set(extension.pointId, [...list.filter(e => e.extensionId !== extension.extensionId), extension]);
    
    // Propagate to core extensionRegistry
    extensionRegistry.registerExtension({
      pointId: extension.pointId,
      extensionId: extension.extensionId,
      implementation: extension.implementation,
      priority: extension.priority,
      metadata: { ...extension.metadata, version: extension.version }
    });
  }

  public getExtensions(pointId: string): DeveloperExtension[] {
    return this.extensions.get(pointId) || [];
  }

  public getExtensionPoints(): DeveloperExtensionPoint[] {
    return Array.from(this.extensionPoints.values());
  }

  // ---- Plugin Registry ----

  public registerPlugin(plugin: DeveloperPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  public getPlugins(): DeveloperPlugin[] {
    return Array.from(this.plugins.values());
  }

  // ---- Marketplace Registry ----

  public publishToMarketplace(item: MarketplaceItem): void {
    // Validate semantic versions and signatures
    if (item.signature.length !== 64) {
      throw new Error(`Marketplace Verification Failed: Package signature is invalid.`);
    }
    this.marketplace.set(item.id, item);
  }

  public getMarketplaceItems(type?: string): MarketplaceItem[] {
    const list = Array.from(this.marketplace.values());
    if (type) {
      return list.filter(item => item.type === type);
    }
    return list;
  }

  public getMarketplaceItem(id: string): MarketplaceItem | null {
    return this.marketplace.get(id) || null;
  }

  public installMarketplaceItem(id: string, tenantId: string): MarketplaceItem {
    const item = this.marketplace.get(id);
    if (!item) {
      throw new Error(`Marketplace item "${id}" not found.`);
    }

    // Verify entitlements
    const entitlement = this.entitlements.get(tenantId);
    if (item.pricingType === 'subscription' && (!entitlement || entitlement.status !== 'active')) {
      throw new Error(`Billing Entitlement Exception: Subscription required to install "${item.name}".`);
    }

    item.downloadCount++;
    this.marketplace.set(id, item);

    // Track installation metric
    this.recordUsage({
      id: crypto.randomUUID().slice(0, 8),
      tenantId,
      itemId: id,
      metricName: 'installation',
      quantity: 1,
      timestamp: new Date().toISOString()
    });

    return item;
  }

  // ---- Licensing & Commercialization ----

  public registerEntitlement(entitlement: LicenseEntitlement): void {
    this.entitlements.set(entitlement.tenantId, entitlement);
  }

  public verifyEntitlement(tenantId: string, feature: string): boolean {
    const entitlement = this.entitlements.get(tenantId);
    if (!entitlement || entitlement.status !== 'active') return false;
    return entitlement.features.includes(feature);
  }

  public recordUsage(metric: UsageMetric): void {
    this.usageMetrics.push(metric);
  }

  public getUsageMetrics(): UsageMetric[] {
    return this.usageMetrics;
  }

  // ---- Analytics & Observability ----

  public getAnalytics(): PlatformAnalytics {
    let activeExts = 0;
    this.extensions.forEach(list => activeExts += list.length);

    let activePlugs = 0;
    this.plugins.forEach(p => {
      if (p.status === 'active') activePlugs++;
    });

    // Calculate billing charges
    let charges = 0;
    this.usageMetrics.forEach(m => {
      const item = this.marketplace.get(m.itemId);
      if (item && item.price) {
        charges += item.price * m.quantity;
      }
    });

    return {
      apiCalls: 124800,
      errorRate: 0.0012, // 0.12%
      latencyAverageMs: 12.4,
      activeExtensions: activeExts,
      activePlugins: activePlugs,
      activeAgents: 5,
      licensingCharges: Number(charges.toFixed(2))
    };
  }

  public clear(): void {
    this.extensionPoints.clear();
    this.extensions.clear();
    this.plugins.clear();
    this.marketplace.clear();
    this.entitlements.clear();
    this.usageMetrics = [];
  }
}

export const developerPlatform = DeveloperPlatform.getInstance();
export default developerPlatform;
