// src/enterprise/features/EnterpriseFeatures.ts
// Enterprise Features — Templates, catalogs, private extensions, app store

// ============================================================================
// Enterprise Feature Types
// ============================================================================

export interface OrganizationTemplate {
  id: string;
  name: string;
  description: string;
  tier: string;
  settings: Record<string, unknown>;
  policies: string[];        // Policy template names to apply
  workspaceTemplates: string[];
  createdAt: string;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  defaultFeatures: string[];
  defaultKnowledgeBases: string[];
  defaultWorkflows: string[];
  defaultAgents: string[];
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface MarketplaceCatalog {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  type: 'curated' | 'private' | 'internal';
  extensionIds: string[];
  visibility: 'public' | 'organization' | 'tenant';
  createdAt: string;
}

export interface PrivateExtension {
  id: string;
  organizationId: string;
  tenantId: string;
  name: string;
  type: 'extension' | 'agent' | 'knowledge-pack' | 'model' | 'workflow';
  version: string;
  description: string;
  status: 'draft' | 'review' | 'approved' | 'published' | 'deprecated';
  visibility: 'tenant' | 'organization' | 'marketplace';
  publishedBy: string;
  downloadCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Enterprise Features Platform
// ============================================================================

export class EnterpriseFeatures {
  private static instance: EnterpriseFeatures | null = null;

  private orgTemplates: Map<string, OrganizationTemplate> = new Map();
  private workspaceTemplates: Map<string, WorkspaceTemplate> = new Map();
  private catalogs: Map<string, MarketplaceCatalog> = new Map();
  private extensions: Map<string, PrivateExtension> = new Map();

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): EnterpriseFeatures {
    if (!EnterpriseFeatures.instance) {
      EnterpriseFeatures.instance = new EnterpriseFeatures();
    }
    return EnterpriseFeatures.instance;
  }

  // ======== Organization Templates ========

  public listOrgTemplates(): OrganizationTemplate[] {
    return Array.from(this.orgTemplates.values());
  }

  public getOrgTemplate(id: string): OrganizationTemplate | null {
    return this.orgTemplates.get(id) ?? null;
  }

  public createOrgTemplate(params: Omit<OrganizationTemplate, 'id' | 'createdAt'>): OrganizationTemplate {
    const template: OrganizationTemplate = {
      ...params,
      id: `otpl-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.orgTemplates.set(template.id, template);
    return template;
  }

  // ======== Workspace Templates ========

  public listWorkspaceTemplates(): WorkspaceTemplate[] {
    return Array.from(this.workspaceTemplates.values());
  }

  public getWorkspaceTemplate(id: string): WorkspaceTemplate | null {
    return this.workspaceTemplates.get(id) ?? null;
  }

  public createWorkspaceTemplate(params: Omit<WorkspaceTemplate, 'id' | 'createdAt'>): WorkspaceTemplate {
    const template: WorkspaceTemplate = {
      ...params,
      id: `wtpl-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.workspaceTemplates.set(template.id, template);
    return template;
  }

  // ======== Marketplace Catalogs ========

  public listCatalogs(organizationId?: string): MarketplaceCatalog[] {
    if (organizationId) {
      return Array.from(this.catalogs.values()).filter(c => c.organizationId === organizationId);
    }
    return Array.from(this.catalogs.values());
  }

  public createCatalog(params: Omit<MarketplaceCatalog, 'id' | 'createdAt'>): MarketplaceCatalog {
    const catalog: MarketplaceCatalog = {
      ...params,
      id: `cat-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.catalogs.set(catalog.id, catalog);
    return catalog;
  }

  // ======== Private Extensions (Internal App Store) ========

  public publishExtension(params: {
    organizationId: string;
    tenantId: string;
    name: string;
    type: PrivateExtension['type'];
    version: string;
    description: string;
    visibility: PrivateExtension['visibility'];
    publishedBy: string;
    metadata?: Record<string, unknown>;
  }): PrivateExtension {
    const ext: PrivateExtension = {
      id: `pext-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      tenantId: params.tenantId,
      name: params.name,
      type: params.type,
      version: params.version,
      description: params.description,
      status: 'published',
      visibility: params.visibility,
      publishedBy: params.publishedBy,
      downloadCount: 0,
      metadata: params.metadata ?? {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.extensions.set(ext.id, ext);
    console.log(`[EnterpriseFeatures] Published private ${params.type}: ${params.name} v${params.version}`);
    return ext;
  }

  public listExtensions(params: { organizationId?: string; tenantId?: string; type?: string }): PrivateExtension[] {
    return Array.from(this.extensions.values()).filter(e => {
      if (params.organizationId && e.organizationId !== params.organizationId) return false;
      if (params.tenantId && e.tenantId !== params.tenantId) return false;
      if (params.type && e.type !== params.type) return false;
      return e.status !== 'deprecated';
    });
  }

  public installExtension(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.downloadCount++;
      console.log(`[EnterpriseFeatures] Installed ${ext.type}: ${ext.name} (downloads: ${ext.downloadCount})`);
    }
  }

  // ======== Default Seeding ========

  private seedDefaults(): void {
    // Organization Templates
    this.orgTemplates.set('startup', {
      id: 'startup', name: 'Startup', description: 'Optimized for small, fast-moving teams.',
      tier: 'professional',
      settings: { maxTeams: 3, defaultWorkspaces: 2 },
      policies: ['Default Authentication Policy', 'Default AI Usage Policy'],
      workspaceTemplates: ['engineering', 'product'],
      createdAt: new Date().toISOString(),
    });

    this.orgTemplates.set('enterprise', {
      id: 'enterprise', name: 'Enterprise', description: 'Full governance and compliance for large organizations.',
      tier: 'enterprise',
      settings: { maxTeams: 100, defaultWorkspaces: 10 },
      policies: ['SOC2 Authentication Policy', 'Enterprise AI Governance Policy', 'GDPR Retention Policy'],
      workspaceTemplates: ['engineering', 'product', 'data-science', 'compliance'],
      createdAt: new Date().toISOString(),
    });

    // Workspace Templates
    this.workspaceTemplates.set('engineering', {
      id: 'engineering', name: 'Engineering', description: 'Software development workspace with code analysis and CI/CD.',
      category: 'development',
      defaultFeatures: ['ai-advanced', 'workflows-advanced', 'marketplace-access'],
      defaultKnowledgeBases: [], defaultWorkflows: [], defaultAgents: [],
      settings: { dataClassification: 'internal' },
      createdAt: new Date().toISOString(),
    });

    this.workspaceTemplates.set('data-science', {
      id: 'data-science', name: 'Data Science', description: 'ML/AI experimentation and model development.',
      category: 'analytics',
      defaultFeatures: ['ai-enterprise', 'knowledge-advanced', 'ai-custom-models'],
      defaultKnowledgeBases: [], defaultWorkflows: [], defaultAgents: [],
      settings: { dataClassification: 'confidential' },
      createdAt: new Date().toISOString(),
    });

    this.workspaceTemplates.set('product', {
      id: 'product', name: 'Product Management', description: 'Product planning, design, and customer research.',
      category: 'product',
      defaultFeatures: ['ai-basic', 'knowledge-basic', 'workflows-basic'],
      defaultKnowledgeBases: [], defaultWorkflows: [], defaultAgents: [],
      settings: { dataClassification: 'internal' },
      createdAt: new Date().toISOString(),
    });

    this.workspaceTemplates.set('compliance', {
      id: 'compliance', name: 'Compliance & Security', description: 'Audit, compliance tracking, and security monitoring.',
      category: 'governance',
      defaultFeatures: ['audit-export', 'advanced-governance'],
      defaultKnowledgeBases: [], defaultWorkflows: [], defaultAgents: [],
      settings: { dataClassification: 'restricted' },
      createdAt: new Date().toISOString(),
    });
  }

  // ======== Statistics ========

  public getStats(): Record<string, number> {
    return {
      orgTemplates: this.orgTemplates.size,
      workspaceTemplates: this.workspaceTemplates.size,
      catalogs: this.catalogs.size,
      privateExtensions: this.extensions.size,
      publishedExtensions: Array.from(this.extensions.values()).filter(e => e.status === 'published').length,
      totalDownloads: Array.from(this.extensions.values()).reduce((s, e) => s + e.downloadCount, 0),
    };
  }
}

export const enterpriseFeatures = EnterpriseFeatures.getInstance();
export default enterpriseFeatures;
