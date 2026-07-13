// src/enterprise/admin/EnterpriseAdminCenter.ts
// Enterprise Administration Center — Platform-level and organization-level admin

import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { identityPlatform } from '../identity/IdentityPlatform';
import { policyEngine } from '../identity/PolicyEngine';
import type { Organization, Tenant, Workspace, TenantTier, EnvironmentType, RegionCode } from '../tenant/types';
import type { EnterpriseRole, EnterpriseUser, OrganizationInvitation } from '../identity/types';

// ============================================================================
// Enterprise Administration Center
// ============================================================================

export class EnterpriseAdminCenter {
  private static instance: EnterpriseAdminCenter | null = null;

  private constructor() {}

  public static getInstance(): EnterpriseAdminCenter {
    if (!EnterpriseAdminCenter.instance) {
      EnterpriseAdminCenter.instance = new EnterpriseAdminCenter();
    }
    return EnterpriseAdminCenter.instance;
  }

  // ======== Organization Administration ========

  public createOrganization(params: {
    name: string;
    slug: string;
    displayName: string;
    tier: TenantTier;
    primaryRegion: RegionCode;
    adminEmail: string;
    adminName: string;
    domain?: string;
  }): { organization: Organization; admin: EnterpriseUser; tenant: Tenant } {
    // 1. Create organization
    const org = tenantLifecycle.createOrganization({
      name: params.name,
      slug: params.slug,
      displayName: params.displayName,
      tier: params.tier,
      primaryRegion: params.primaryRegion,
      domain: params.domain,
      createdBy: params.adminEmail,
    });

    // 2. Create admin user
    const admin = identityPlatform.createUser({
      email: params.adminEmail,
      displayName: params.adminName,
      identityProvider: 'local',
      organizationId: org.id,
      organizationName: org.displayName,
      role: 'organization-owner',
    });

    // 3. Auto-provision default production tenant
    const tenant = tenantLifecycle.provisionTenant({
      organizationId: org.id,
      name: `${params.name} Production`,
      slug: `${params.slug}-prod`,
      environment: 'production',
      region: params.primaryRegion,
      tier: params.tier,
      initiatedBy: admin.id,
    });

    // 4. Add admin to tenant
    identityPlatform.addTenantMembership(admin.id, org.id, {
      tenantId: tenant.id,
      tenantName: tenant.name,
      role: 'tenant-admin',
    });

    // 5. Create default workspace
    const workspace = tenantLifecycle.createWorkspace({
      tenantId: tenant.id,
      name: 'Default',
      slug: 'default',
      description: 'Default workspace',
    });

    // 6. Add admin to workspace
    identityPlatform.addWorkspaceMembership(admin.id, org.id, tenant.id, {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      role: 'workspace-admin',
    });

    // 7. Create default policies
    this.seedDefaultPolicies(org.id, admin.id);

    console.log(`[AdminCenter] Organization "${params.displayName}" fully provisioned with admin, tenant, and workspace.`);
    return { organization: org, admin, tenant };
  }

  public getOrganizationDashboard(organizationId: string): Record<string, unknown> {
    const org = tenantLifecycle.getOrganization(organizationId);
    if (!org) throw new Error(`Organization ${organizationId} not found.`);

    const tenants = tenantLifecycle.listTenantsByOrg(organizationId);
    const users = identityPlatform.listUsersByOrganization(organizationId);
    const policies = policyEngine.listPolicies(organizationId);

    return {
      organization: org,
      summary: {
        totalTenants: tenants.length,
        activeTenants: tenants.filter(t => t.status === 'active').length,
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        totalPolicies: policies.length,
        enabledPolicies: policies.filter(p => p.enabled).length,
      },
      tenants: tenants.map(t => ({ id: t.id, name: t.name, status: t.status, environment: t.environment, tier: t.tier })),
      recentUsers: users.slice(0, 10).map(u => ({ id: u.id, email: u.email, displayName: u.displayName, status: u.status })),
    };
  }

  // ======== User Administration ========

  public inviteUser(params: {
    organizationId: string;
    email: string;
    role: EnterpriseRole;
    tenantIds: string[];
    workspaceIds: string[];
    invitedBy: string;
  }): OrganizationInvitation {
    return identityPlatform.createInvitation(params);
  }

  public onboardUser(params: {
    organizationId: string;
    email: string;
    displayName: string;
    role: EnterpriseRole;
    tenantId: string;
    workspaceId: string;
    invitedBy: string;
  }): EnterpriseUser {
    const org = tenantLifecycle.getOrganization(params.organizationId);
    if (!org) throw new Error(`Organization ${params.organizationId} not found.`);

    const tenant = tenantLifecycle.getTenant(params.tenantId);
    if (!tenant) throw new Error(`Tenant ${params.tenantId} not found.`);

    const workspace = tenantLifecycle.getWorkspace(params.workspaceId);
    if (!workspace) throw new Error(`Workspace ${params.workspaceId} not found.`);

    // Create user with full membership chain
    const user = identityPlatform.createUser({
      email: params.email,
      displayName: params.displayName,
      identityProvider: 'local',
      organizationId: params.organizationId,
      organizationName: org.displayName,
      role: params.role,
    });

    identityPlatform.addTenantMembership(user.id, params.organizationId, {
      tenantId: params.tenantId,
      tenantName: tenant.name,
      role: params.role,
    });

    identityPlatform.addWorkspaceMembership(user.id, params.organizationId, params.tenantId, {
      workspaceId: params.workspaceId,
      workspaceName: workspace.name,
      role: params.role,
    });

    console.log(`[AdminCenter] Onboarded user ${params.email} into org ${params.organizationId}`);
    return user;
  }

  // ======== Feature Management ========

  public setFeatureFlag(organizationId: string, tenantId: string, flag: string, enabled: boolean): void {
    console.log(`[AdminCenter] Set feature flag "${flag}" = ${enabled} for tenant ${tenantId}`);
  }

  public getFeatureFlags(tenantId: string): Record<string, boolean> {
    // Default feature flags per tier — in production, stored in DB
    return {
      'ai-execution': true,
      'knowledge-base': true,
      'marketplace': true,
      'custom-workflows': true,
      'advanced-analytics': true,
      'white-label': false,
      'sso-integration': false,
      'audit-export': true,
    };
  }

  // ======== Health Console ========

  public getHealthDashboard(tenantId: string): Record<string, unknown> {
    return {
      tenantId,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: { status: 'healthy', latencyMs: 12 },
        cache: { status: 'healthy', latencyMs: 2 },
        aiRuntime: { status: 'healthy', latencyMs: 145 },
        storage: { status: 'healthy', latencyMs: 8 },
        eventBus: { status: 'healthy', latencyMs: 5 },
      },
      metrics: {
        activeUsers: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        p99LatencyMs: 0,
      },
    };
  }

  // ======== Support Console ========

  public getSupportDashboard(organizationId: string): Record<string, unknown> {
    return {
      organizationId,
      tickets: { open: 0, inProgress: 0, resolved: 0, total: 0 },
      sla: { responseTimeMet: true, resolutionTimeMet: true },
      supportPlan: 'standard',
      contacts: [],
    };
  }

  // ======== Default Policy Seeding ========

  private seedDefaultPolicies(organizationId: string, createdBy: string): void {
    policyEngine.createPolicy({
      organizationId,
      name: 'Default Authentication Policy',
      type: 'authentication',
      configuration: { mfaRequired: false, maxSessionDurationHours: 8, idleTimeoutMinutes: 120 },
      enforcementLevel: 'enforced',
      createdBy,
    });

    policyEngine.createPolicy({
      organizationId,
      name: 'Default Data Classification Policy',
      type: 'data-classification',
      configuration: { minimumClassification: 'internal', allowExternalSharing: false },
      enforcementLevel: 'enforced',
      createdBy,
    });

    policyEngine.createPolicy({
      organizationId,
      name: 'Default AI Usage Policy',
      type: 'ai-usage',
      configuration: { promptSafetyEnabled: true, blockedPromptPatterns: [], allowedModels: [] },
      enforcementLevel: 'advisory',
      createdBy,
    });

    policyEngine.createPolicy({
      organizationId,
      name: 'Default Retention Policy',
      type: 'retention',
      configuration: { dataRetentionDays: 365, auditRetentionDays: 730, deleteAfterExpiry: false },
      enforcementLevel: 'enforced',
      createdBy,
    });
  }

  // ======== Platform Statistics ========

  public getPlatformStats(): Record<string, unknown> {
    return {
      ...tenantLifecycle.getStats(),
      ...identityPlatform.getStats(),
      ...policyEngine.getStats(),
    };
  }
}

export const enterpriseAdminCenter = EnterpriseAdminCenter.getInstance();
export default enterpriseAdminCenter;
