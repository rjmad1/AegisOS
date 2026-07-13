// src/enterprise/tenant/TenantLifecycle.ts
// Full tenant lifecycle management: provision, suspend, archive, delete, migrate, clone, backup

import type {
  Organization, Tenant, Workspace, TenantStatus, TenantTier,
  OrganizationSettings, TenantSettings, ResourceQuotas,
  TenantLifecycleEvent, TenantLifecycleAction, TenantMigrationPlan,
  TenantBackup, MigrationCheckpoint, EnvironmentType, RegionCode, IsolationLevel,
} from './types';
import { tenantResolver } from './TenantResolver';

// ============================================================================
// Default Configuration Factories
// ============================================================================

function defaultOrgSettings(tier: TenantTier): OrganizationSettings {
  const limits: Record<TenantTier, Partial<OrganizationSettings>> = {
    free:         { maxTenants: 1,   maxUsersPerTenant: 5,    maxWorkspacesPerTenant: 3,   ssoEnabled: false, mfaRequired: false, customBrandingEnabled: false, marketplaceEnabled: false },
    professional: { maxTenants: 3,   maxUsersPerTenant: 25,   maxWorkspacesPerTenant: 10,  ssoEnabled: false, mfaRequired: false, customBrandingEnabled: false, marketplaceEnabled: true  },
    business:     { maxTenants: 10,  maxUsersPerTenant: 100,  maxWorkspacesPerTenant: 50,  ssoEnabled: true,  mfaRequired: false, customBrandingEnabled: true,  marketplaceEnabled: true  },
    enterprise:   { maxTenants: 100, maxUsersPerTenant: 1000, maxWorkspacesPerTenant: 500, ssoEnabled: true,  mfaRequired: true,  customBrandingEnabled: true,  marketplaceEnabled: true  },
    custom:       { maxTenants: 999, maxUsersPerTenant: 9999, maxWorkspacesPerTenant: 999, ssoEnabled: true,  mfaRequired: true,  customBrandingEnabled: true,  marketplaceEnabled: true  },
  };
  return {
    ...limits[tier],
    ssoProvider: null,
    ipAllowlist: [],
    dataRetentionDays: 365,
    auditRetentionDays: 730,
    aiPolicyEnabled: tier !== 'free',
  } as OrganizationSettings;
}

function defaultTenantSettings(tier: TenantTier): TenantSettings {
  const limits: Record<TenantTier, Partial<TenantSettings>> = {
    free:         { maxWorkspaces: 3,   maxUsers: 5,    maxStorageGb: 1,    maxAiRequestsPerDay: 100    },
    professional: { maxWorkspaces: 10,  maxUsers: 25,   maxStorageGb: 10,   maxAiRequestsPerDay: 1000   },
    business:     { maxWorkspaces: 50,  maxUsers: 100,  maxStorageGb: 100,  maxAiRequestsPerDay: 10000  },
    enterprise:   { maxWorkspaces: 500, maxUsers: 1000, maxStorageGb: 1000, maxAiRequestsPerDay: 100000 },
    custom:       { maxWorkspaces: 999, maxUsers: 9999, maxStorageGb: 9999, maxAiRequestsPerDay: 999999 },
  };
  return {
    ...limits[tier],
    maxApiKeysPerUser: tier === 'free' ? 2 : 10,
    customEncryptionKey: null,
    backupEnabled: tier !== 'free',
    backupFrequencyHours: tier === 'enterprise' ? 1 : 24,
    crossRegionReplication: tier === 'enterprise' || tier === 'custom',
    replicationRegions: [],
  } as TenantSettings;
}

function defaultResourceQuotas(tier: TenantTier): ResourceQuotas {
  const quotas: Record<TenantTier, ResourceQuotas> = {
    free:         { maxStorageBytes: 1e9,   maxAiTokensPerMonth: 100_000,     maxApiCallsPerMinute: 60,   maxConcurrentWorkflows: 2,  maxAgents: 2,   maxKnowledgeBases: 1,  maxPlugins: 3,   maxCustomModels: 0   },
    professional: { maxStorageBytes: 10e9,  maxAiTokensPerMonth: 1_000_000,   maxApiCallsPerMinute: 300,  maxConcurrentWorkflows: 10, maxAgents: 10,  maxKnowledgeBases: 5,  maxPlugins: 20,  maxCustomModels: 2   },
    business:     { maxStorageBytes: 100e9, maxAiTokensPerMonth: 10_000_000,  maxApiCallsPerMinute: 1000, maxConcurrentWorkflows: 50, maxAgents: 50,  maxKnowledgeBases: 20, maxPlugins: 100, maxCustomModels: 10  },
    enterprise:   { maxStorageBytes: 1e12,  maxAiTokensPerMonth: 100_000_000, maxApiCallsPerMinute: 5000, maxConcurrentWorkflows: 200, maxAgents: 200, maxKnowledgeBases: 100, maxPlugins: 500, maxCustomModels: 50  },
    custom:       { maxStorageBytes: 1e13,  maxAiTokensPerMonth: 999_999_999, maxApiCallsPerMinute: 9999, maxConcurrentWorkflows: 999, maxAgents: 999, maxKnowledgeBases: 999, maxPlugins: 999, maxCustomModels: 999 },
  };
  return quotas[tier];
}

// ============================================================================
// Tenant Lifecycle Manager
// ============================================================================

export class TenantLifecycle {
  private static instance: TenantLifecycle | null = null;

  private organizations: Map<string, Organization> = new Map();
  private tenants: Map<string, Tenant> = new Map();
  private workspaces: Map<string, Workspace> = new Map();
  private lifecycleEvents: TenantLifecycleEvent[] = [];
  private migrations: Map<string, TenantMigrationPlan> = new Map();
  private backups: Map<string, TenantBackup> = new Map();

  private constructor() {}

  public static getInstance(): TenantLifecycle {
    if (!TenantLifecycle.instance) {
      TenantLifecycle.instance = new TenantLifecycle();
    }
    return TenantLifecycle.instance;
  }

  // ==== Organization Lifecycle ====

  public createOrganization(params: {
    name: string;
    slug: string;
    displayName: string;
    tier: TenantTier;
    primaryRegion: RegionCode;
    domain?: string;
    createdBy: string;
  }): Organization {
    if (this.getOrganizationBySlug(params.slug)) {
      throw new Error(`Organization slug "${params.slug}" already exists.`);
    }

    const org: Organization = {
      id: `org-${crypto.randomUUID()}`,
      name: params.name,
      slug: params.slug,
      displayName: params.displayName,
      status: 'active',
      tier: params.tier,
      domain: params.domain ?? null,
      customDomain: null,
      logoUrl: null,
      primaryRegion: params.primaryRegion,
      settings: defaultOrgSettings(params.tier),
      metadata: { createdBy: params.createdBy },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    this.organizations.set(org.id, org);
    console.log(`[TenantLifecycle] Created organization: ${org.displayName} (${org.id})`);
    return org;
  }

  public getOrganization(id: string): Organization | null {
    return this.organizations.get(id) ?? null;
  }

  public getOrganizationBySlug(slug: string): Organization | null {
    for (const org of this.organizations.values()) {
      if (org.slug === slug && org.status !== 'deleted') return org;
    }
    return null;
  }

  public listOrganizations(): Organization[] {
    return Array.from(this.organizations.values()).filter(o => o.status !== 'deleted');
  }

  // ==== Tenant Provisioning ====

  public provisionTenant(params: {
    organizationId: string;
    name: string;
    slug: string;
    environment: EnvironmentType;
    region: RegionCode;
    tier?: TenantTier;
    isolationLevel?: IsolationLevel;
    initiatedBy: string;
  }): Tenant {
    const org = this.organizations.get(params.organizationId);
    if (!org) throw new Error(`Organization ${params.organizationId} not found.`);
    if (org.status !== 'active') throw new Error(`Organization ${params.organizationId} is not active.`);

    // Check tenant limits
    const orgTenants = this.listTenantsByOrg(params.organizationId);
    if (orgTenants.length >= org.settings.maxTenants) {
      throw new Error(`Organization has reached maximum tenant limit (${org.settings.maxTenants}).`);
    }

    const tier = params.tier ?? org.tier;
    const tenant: Tenant = {
      id: `tnt-${crypto.randomUUID()}`,
      organizationId: params.organizationId,
      name: params.name,
      slug: params.slug,
      displayName: params.name,
      status: 'provisioning',
      environment: params.environment,
      region: params.region,
      isolationLevel: params.isolationLevel ?? 'shared',
      tier,
      settings: defaultTenantSettings(tier),
      resourceQuotas: defaultResourceQuotas(tier),
      metadata: { initiatedBy: params.initiatedBy },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      suspendedAt: null,
      archivedAt: null,
      deletedAt: null,
    };

    this.tenants.set(tenant.id, tenant);
    this.emitLifecycleEvent(tenant.id, params.organizationId, 'provision', params.initiatedBy);

    // Register with tenant resolver for request routing
    tenantResolver.registerTenant({
      tenantId: tenant.id,
      organizationId: tenant.organizationId,
      slug: tenant.slug,
      customDomain: null,
      region: tenant.region,
      tier: tenant.tier,
      status: tenant.status,
    });

    // Complete provisioning (in production: async with schema creation, seeding, etc.)
    tenant.status = 'active';
    tenant.updatedAt = new Date().toISOString();

    console.log(`[TenantLifecycle] Provisioned tenant: ${tenant.name} (${tenant.id}) for org ${params.organizationId}`);
    return tenant;
  }

  public getTenant(id: string): Tenant | null {
    return this.tenants.get(id) ?? null;
  }

  public listTenantsByOrg(organizationId: string): Tenant[] {
    return Array.from(this.tenants.values()).filter(
      t => t.organizationId === organizationId && t.status !== 'deleted'
    );
  }

  // ==== Tenant Status Transitions ====

  public suspendTenant(tenantId: string, reason: string, initiatedBy: string): Tenant {
    const tenant = this.requireTenant(tenantId);
    if (tenant.status !== 'active') throw new Error(`Tenant ${tenantId} is not active (current: ${tenant.status}).`);

    tenant.status = 'suspended';
    tenant.suspendedAt = new Date().toISOString();
    tenant.updatedAt = new Date().toISOString();
    tenant.metadata = { ...tenant.metadata, suspensionReason: reason };

    this.emitLifecycleEvent(tenantId, tenant.organizationId, 'suspend', initiatedBy, { reason });
    console.log(`[TenantLifecycle] Suspended tenant: ${tenant.name} (${tenantId}). Reason: ${reason}`);
    return tenant;
  }

  public resumeTenant(tenantId: string, initiatedBy: string): Tenant {
    const tenant = this.requireTenant(tenantId);
    if (tenant.status !== 'suspended') throw new Error(`Tenant ${tenantId} is not suspended.`);

    tenant.status = 'active';
    tenant.suspendedAt = null;
    tenant.updatedAt = new Date().toISOString();

    this.emitLifecycleEvent(tenantId, tenant.organizationId, 'resume', initiatedBy);
    console.log(`[TenantLifecycle] Resumed tenant: ${tenant.name} (${tenantId})`);
    return tenant;
  }

  public archiveTenant(tenantId: string, initiatedBy: string): Tenant {
    const tenant = this.requireTenant(tenantId);
    if (tenant.status === 'deleted') throw new Error(`Tenant ${tenantId} is already deleted.`);

    tenant.status = 'archived';
    tenant.archivedAt = new Date().toISOString();
    tenant.updatedAt = new Date().toISOString();

    this.emitLifecycleEvent(tenantId, tenant.organizationId, 'archive', initiatedBy);
    console.log(`[TenantLifecycle] Archived tenant: ${tenant.name} (${tenantId})`);
    return tenant;
  }

  public deleteTenant(tenantId: string, initiatedBy: string): void {
    const tenant = this.requireTenant(tenantId);

    tenant.status = 'deleted';
    tenant.deletedAt = new Date().toISOString();
    tenant.updatedAt = new Date().toISOString();

    // Delete all workspaces
    for (const ws of this.listWorkspacesByTenant(tenantId)) {
      ws.status = 'deleted';
      ws.deletedAt = new Date().toISOString();
    }

    this.emitLifecycleEvent(tenantId, tenant.organizationId, 'delete', initiatedBy);
    console.log(`[TenantLifecycle] Deleted tenant: ${tenant.name} (${tenantId})`);
  }

  // ==== Workspace Management ====

  public createWorkspace(params: {
    tenantId: string;
    name: string;
    slug: string;
    description: string;
    departmentId?: string;
    businessUnitId?: string;
  }): Workspace {
    const tenant = this.requireTenant(params.tenantId);
    const existing = this.listWorkspacesByTenant(params.tenantId);
    if (existing.length >= tenant.settings.maxWorkspaces) {
      throw new Error(`Tenant has reached maximum workspace limit (${tenant.settings.maxWorkspaces}).`);
    }

    const workspace: Workspace = {
      id: `ws-${crypto.randomUUID()}`,
      tenantId: params.tenantId,
      organizationId: tenant.organizationId,
      name: params.name,
      slug: params.slug,
      description: params.description,
      status: 'active',
      departmentId: params.departmentId ?? null,
      businessUnitId: params.businessUnitId ?? null,
      projectId: null,
      settings: {
        defaultAiModel: null,
        knowledgeBaseIds: [],
        enabledFeatures: [],
        dataClassification: 'internal',
        retentionDays: 365,
        notificationChannels: [],
      },
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    this.workspaces.set(workspace.id, workspace);
    console.log(`[TenantLifecycle] Created workspace: ${workspace.name} (${workspace.id}) in tenant ${params.tenantId}`);
    return workspace;
  }

  public listWorkspacesByTenant(tenantId: string): Workspace[] {
    return Array.from(this.workspaces.values()).filter(
      w => w.tenantId === tenantId && w.status !== 'deleted'
    );
  }

  public getWorkspace(id: string): Workspace | null {
    return this.workspaces.get(id) ?? null;
  }

  // ==== Tenant Migration ====

  public planMigration(params: {
    sourceTenantId: string;
    targetRegion: RegionCode;
    strategy: 'live' | 'offline' | 'blue-green';
    includeData: boolean;
    includeConfigurations: boolean;
    includeUsers: boolean;
    scheduledAt?: string;
  }): TenantMigrationPlan {
    const source = this.requireTenant(params.sourceTenantId);

    const plan: TenantMigrationPlan = {
      id: `mig-${crypto.randomUUID()}`,
      sourceTenantId: params.sourceTenantId,
      targetTenantId: '', // Assigned during execution
      sourceRegion: source.region,
      targetRegion: params.targetRegion,
      strategy: params.strategy,
      includeData: params.includeData,
      includeConfigurations: params.includeConfigurations,
      includeUsers: params.includeUsers,
      scheduledAt: params.scheduledAt ?? null,
      status: 'planned',
      progress: 0,
      checkpoints: [
        { name: 'schema-migration', status: 'pending', dataSize: 0, recordCount: 0, startedAt: null, completedAt: null },
        { name: 'data-export', status: 'pending', dataSize: 0, recordCount: 0, startedAt: null, completedAt: null },
        { name: 'data-import', status: 'pending', dataSize: 0, recordCount: 0, startedAt: null, completedAt: null },
        { name: 'validation', status: 'pending', dataSize: 0, recordCount: 0, startedAt: null, completedAt: null },
        { name: 'dns-switchover', status: 'pending', dataSize: 0, recordCount: 0, startedAt: null, completedAt: null },
      ],
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    this.migrations.set(plan.id, plan);
    this.emitLifecycleEvent(params.sourceTenantId, source.organizationId, 'migrate', 'system', { migrationId: plan.id });
    console.log(`[TenantLifecycle] Migration planned: ${plan.id} from ${plan.sourceRegion} to ${plan.targetRegion}`);
    return plan;
  }

  public getMigration(id: string): TenantMigrationPlan | null {
    return this.migrations.get(id) ?? null;
  }

  // ==== Tenant Cloning ====

  public cloneTenant(sourceTenantId: string, params: {
    name: string;
    slug: string;
    environment: EnvironmentType;
    initiatedBy: string;
  }): Tenant {
    const source = this.requireTenant(sourceTenantId);

    const cloned = this.provisionTenant({
      organizationId: source.organizationId,
      name: params.name,
      slug: params.slug,
      environment: params.environment,
      region: source.region,
      tier: source.tier,
      isolationLevel: source.isolationLevel,
      initiatedBy: params.initiatedBy,
    });

    // Copy settings from source
    cloned.settings = { ...source.settings };
    cloned.resourceQuotas = { ...source.resourceQuotas };
    cloned.metadata = { ...cloned.metadata, clonedFrom: sourceTenantId };

    this.emitLifecycleEvent(sourceTenantId, source.organizationId, 'clone', params.initiatedBy, { clonedTenantId: cloned.id });
    console.log(`[TenantLifecycle] Cloned tenant ${sourceTenantId} -> ${cloned.id}`);
    return cloned;
  }

  // ==== Tenant Backup ====

  public createBackup(tenantId: string, type: 'full' | 'incremental' | 'differential' = 'full'): TenantBackup {
    const tenant = this.requireTenant(tenantId);

    const backup: TenantBackup = {
      id: `bkp-${crypto.randomUUID()}`,
      tenantId,
      organizationId: tenant.organizationId,
      type,
      status: 'in-progress',
      sizeBytes: 0,
      storageLocation: `s3://openclaw-backups/${tenant.organizationId}/${tenantId}/${new Date().toISOString()}`,
      region: tenant.region,
      encryptionKeyId: tenant.settings.customEncryptionKey,
      retentionDays: 90,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      completedAt: null,
      restoredAt: null,
    };

    // Simulate backup completion
    backup.status = 'completed';
    backup.sizeBytes = Math.floor(Math.random() * 1e9);
    backup.completedAt = new Date().toISOString();

    this.backups.set(backup.id, backup);
    this.emitLifecycleEvent(tenantId, tenant.organizationId, 'backup', 'system', { backupId: backup.id });
    console.log(`[TenantLifecycle] Backup created: ${backup.id} for tenant ${tenantId} (${backup.sizeBytes} bytes)`);
    return backup;
  }

  public listBackups(tenantId: string): TenantBackup[] {
    return Array.from(this.backups.values()).filter(b => b.tenantId === tenantId);
  }

  public getBackup(id: string): TenantBackup | null {
    return this.backups.get(id) ?? null;
  }

  // ==== Lifecycle Events ====

  private emitLifecycleEvent(
    tenantId: string, organizationId: string, action: TenantLifecycleAction,
    initiatedBy: string, details: Record<string, unknown> = {},
  ): void {
    const event: TenantLifecycleEvent = {
      id: `evt-${crypto.randomUUID()}`,
      tenantId,
      organizationId,
      action,
      status: 'completed',
      initiatedBy,
      details,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      error: null,
    };
    this.lifecycleEvents.push(event);
  }

  public getLifecycleEvents(tenantId: string): TenantLifecycleEvent[] {
    return this.lifecycleEvents.filter(e => e.tenantId === tenantId);
  }

  // ==== Helpers ====

  private requireTenant(tenantId: string): Tenant {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);
    return tenant;
  }

  // ==== Statistics ====

  public getStats(): Record<string, number> {
    return {
      totalOrganizations: this.listOrganizations().length,
      totalTenants: Array.from(this.tenants.values()).filter(t => t.status !== 'deleted').length,
      totalWorkspaces: Array.from(this.workspaces.values()).filter(w => w.status !== 'deleted').length,
      activeTenants: Array.from(this.tenants.values()).filter(t => t.status === 'active').length,
      suspendedTenants: Array.from(this.tenants.values()).filter(t => t.status === 'suspended').length,
      totalMigrations: this.migrations.size,
      totalBackups: this.backups.size,
      totalLifecycleEvents: this.lifecycleEvents.length,
    };
  }
}

export const tenantLifecycle = TenantLifecycle.getInstance();
export default tenantLifecycle;
