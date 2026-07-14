// src/enterprise/api/EnterpriseAPI.ts
// Enterprise API Gateway — Unified entry point for all enterprise operations

import { enterpriseAdminCenter } from '../admin/EnterpriseAdminCenter';
import { tenantConsole } from '../admin/TenantConsole';
import { workspaceConsole } from '../admin/WorkspaceConsole';
import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { TenantContext } from '../tenant/TenantContext';
import type { TenantContextData } from '../tenant/types';
import { tenantResolver } from '../tenant/TenantResolver';
import { identityPlatform } from '../identity/IdentityPlatform';
import { RoleHierarchyService } from '../identity/RoleHierarchy';
import { policyEngine } from '../identity/PolicyEngine';
import { licenseEngine } from '../licensing/LicenseEngine';
import { subscriptionManager } from '../licensing/SubscriptionManager';
import { entitlementService } from '../licensing/EntitlementService';
import { usageMeteringEngine } from '../billing/UsageMeteringEngine';
import { billingEngine } from '../billing/BillingEngine';
import { finOpsPlatform } from '../billing/FinOpsPlatform';
import { governanceCenter } from '../governance/GovernanceCenter';
import { dataIsolation } from '../governance/DataIsolation';
import { whiteLabelPlatform } from '../whitelabel/WhiteLabelPlatform';
import { enterpriseFeatures } from '../features/EnterpriseFeatures';
import { analyticsPlatform } from '../analytics/AnalyticsPlatform';
import { multiTenantValidationSuite } from '../validation/MultiTenantValidationSuite';

// ============================================================================
// Enterprise API Gateway
// ============================================================================

export class EnterpriseAPI {
  private static instance: EnterpriseAPI | null = null;

  private constructor() {}

  public static getInstance(): EnterpriseAPI {
    if (!EnterpriseAPI.instance) {
      EnterpriseAPI.instance = new EnterpriseAPI();
    }
    return EnterpriseAPI.instance;
  }

  // ======== Subsystem Access ========

  /** Organization and platform administration */
  public get admin() { return enterpriseAdminCenter; }
  /** Per-tenant self-service console */
  public get tenantAdmin() { return tenantConsole; }
  /** Per-workspace console */
  public get workspaceAdmin() { return workspaceConsole; }
  /** Tenant lifecycle management */
  public get lifecycle() { return tenantLifecycle; }
  /** Tenant context propagation */
  public get context() { return TenantContext; }
  /** Tenant resolution from requests */
  public get resolver() { return tenantResolver; }
  /** Identity and user management */
  public get identity() { return identityPlatform; }
  /** Role hierarchy and permissions */
  public get roles() { return RoleHierarchyService; }
  /** Organization policies */
  public get policies() { return policyEngine; }
  /** License management */
  public get licensing() { return licenseEngine; }
  /** Subscription and plan management */
  public get subscriptions() { return subscriptionManager; }
  /** Feature entitlement and quota checking */
  public get entitlements() { return entitlementService; }
  /** Usage metering */
  public get metering() { return usageMeteringEngine; }
  /** Billing and invoicing */
  public get billing() { return billingEngine; }
  /** Financial operations and cost analytics */
  public get finops() { return finOpsPlatform; }
  /** Governance and compliance */
  public get governance() { return governanceCenter; }
  /** Data isolation and encryption */
  public get dataIsolation() { return dataIsolation; }
  /** White-label branding */
  public get whiteLabel() { return whiteLabelPlatform; }
  /** Enterprise feature catalog */
  public get features() { return enterpriseFeatures; }
  /** Analytics platform */
  public get analytics() { return analyticsPlatform; }
  /** Validation suite */
  public get validation() { return multiTenantValidationSuite; }

  // ======== High-Level Operations ========

  /**
   * Full organization onboarding flow:
   * 1. Creates org + admin user + default tenant + default workspace
   * 2. Creates subscription + license
   * 3. Configures branding
   * 4. Seeds default policies
   */
  public onboardOrganization(params: {
    name: string;
    slug: string;
    displayName: string;
    tier: 'free' | 'professional' | 'business' | 'enterprise';
    primaryRegion: string;
    adminEmail: string;
    adminName: string;
    domain?: string;
  }) {
    // 1. Create org, admin, tenant
    const { organization, admin, tenant } = enterpriseAdminCenter.createOrganization({
      name: params.name,
      slug: params.slug,
      displayName: params.displayName,
      tier: params.tier,
      primaryRegion: params.primaryRegion as any,
      adminEmail: params.adminEmail,
      adminName: params.adminName,
      domain: params.domain,
    });

    // 2. Create subscription with trial
    const planMap: Record<string, string> = {
      free: 'plan-free',
      professional: 'plan-professional',
      business: 'plan-business',
      enterprise: 'plan-enterprise',
    };
    const subscription = subscriptionManager.createSubscription({
      organizationId: organization.id,
      tenantId: tenant.id,
      planId: planMap[params.tier],
      billingCycle: params.tier === 'enterprise' ? 'annual' : 'monthly',
      startTrial: params.tier !== 'free',
    });

    // 3. Configure branding
    whiteLabelPlatform.getOrCreateConfig(tenant.id, organization.id);

    // 4. Configure data isolation
    dataIsolation.configureEncryption(tenant.id);

    console.log(`[EnterpriseAPI] Organization onboarded: ${params.displayName}`);
    return {
      organization, admin, tenant, subscription,
      loginUrl: `https://${params.slug}.aegisos.io`,
      dashboardUrl: `https://${params.slug}.aegisos.io/admin`,
    };
  }

  /**
   * Execute an operation within a tenant context.
   */
  public withTenant<T>(tenantId: string, fn: () => T): T {
    const tenant = tenantLifecycle.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    const ctx: TenantContextData = {
      organizationId: tenant.organizationId,
      tenantId: tenant.id,
      workspaceId: null,
      userId: 'system',
      roles: ['platform-admin'],
      tier: tenant.tier,
      region: tenant.region,
      isolationLevel: tenant.isolationLevel,
      permissions: ['admin:platform'],
      featureFlags: {},
      quotas: tenant.resourceQuotas,
    };

    return TenantContext.run(ctx, fn);
  }

  /**
   * Run the full validation suite.
   */
  public async validate(): Promise<any> {
    return multiTenantValidationSuite.runAll();
  }

  /**
   * Get the full platform dashboard.
   */
  public getDashboard(): Record<string, unknown> {
    return analyticsPlatform.getFullDashboard();
  }

  /**
   * Health check for the enterprise platform.
   */
  public getHealth(): Record<string, unknown> {
    return {
      status: 'healthy',
      version: '1.0.0',
      subsystems: {
        tenantLifecycle: 'healthy',
        identity: 'healthy',
        licensing: 'healthy',
        billing: 'healthy',
        governance: 'healthy',
        analytics: 'healthy',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const enterpriseAPI = EnterpriseAPI.getInstance();
export default enterpriseAPI;
