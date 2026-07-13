// src/enterprise/admin/TenantConsole.ts
// Per-tenant self-service administration console

import { tenantLifecycle } from '../tenant/TenantLifecycle';
import { identityPlatform } from '../identity/IdentityPlatform';
import { TenantContext } from '../tenant/TenantContext';
import type { Workspace, TenantSettings } from '../tenant/types';
import type { EnterpriseRole, EnterpriseUser, ServiceAccount, Team } from '../identity/types';

// ============================================================================
// Tenant Console — Self-service administration for tenant admins
// ============================================================================

export class TenantConsole {
  private static instance: TenantConsole | null = null;

  private constructor() {}

  public static getInstance(): TenantConsole {
    if (!TenantConsole.instance) {
      TenantConsole.instance = new TenantConsole();
    }
    return TenantConsole.instance;
  }

  /** Get tenant overview dashboard */
  public getDashboard(tenantId: string): Record<string, unknown> {
    const tenant = tenantLifecycle.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    const workspaces = tenantLifecycle.listWorkspacesByTenant(tenantId);
    const users = identityPlatform.listUsersByTenant(tenantId);
    const serviceAccounts = identityPlatform.listServiceAccounts(tenantId);
    const apiClients = identityPlatform.listApiClients(tenantId);

    return {
      tenant: {
        id: tenant.id, name: tenant.name, status: tenant.status,
        environment: tenant.environment, region: tenant.region, tier: tenant.tier,
      },
      summary: {
        workspaces: workspaces.length,
        users: users.length,
        serviceAccounts: serviceAccounts.length,
        apiClients: apiClients.length,
      },
      quotas: tenant.resourceQuotas,
      settings: tenant.settings,
      workspaces: workspaces.map(w => ({
        id: w.id, name: w.name, status: w.status, description: w.description,
      })),
    };
  }

  /** Update tenant settings */
  public updateSettings(tenantId: string, updates: Partial<TenantSettings>): void {
    const tenant = tenantLifecycle.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);
    Object.assign(tenant.settings, updates);
    tenant.updatedAt = new Date().toISOString();
    console.log(`[TenantConsole] Updated settings for tenant ${tenantId}`);
  }

  /** Create workspace within tenant */
  public createWorkspace(tenantId: string, params: {
    name: string; slug: string; description: string;
    departmentId?: string; businessUnitId?: string;
  }): Workspace {
    return tenantLifecycle.createWorkspace({ tenantId, ...params });
  }

  /** Manage tenant users */
  public addUser(tenantId: string, params: {
    email: string; displayName: string; role: EnterpriseRole;
    workspaceIds?: string[];
  }): EnterpriseUser {
    const tenant = tenantLifecycle.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    const user = identityPlatform.createUser({
      email: params.email,
      displayName: params.displayName,
      identityProvider: 'local',
      organizationId: tenant.organizationId,
      organizationName: tenant.organizationId,
      role: params.role,
    });

    identityPlatform.addTenantMembership(user.id, tenant.organizationId, {
      tenantId, tenantName: tenant.name, role: params.role,
    });

    // Add to specified workspaces
    if (params.workspaceIds) {
      for (const wsId of params.workspaceIds) {
        const ws = tenantLifecycle.getWorkspace(wsId);
        if (ws) {
          identityPlatform.addWorkspaceMembership(user.id, tenant.organizationId, tenantId, {
            workspaceId: wsId, workspaceName: ws.name, role: 'member',
          });
        }
      }
    }

    return user;
  }

  /** Create service account */
  public createServiceAccount(tenantId: string, params: {
    name: string; description: string; scopes: string[]; createdBy: string;
  }): ServiceAccount & { apiKey: string } {
    const tenant = tenantLifecycle.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant ${tenantId} not found.`);

    return identityPlatform.createServiceAccount({
      ...params,
      organizationId: tenant.organizationId,
      tenantId,
      role: 'service-account',
    });
  }

  /** Create team within workspace */
  public createTeam(tenantId: string, workspaceId: string, params: {
    name: string; description: string; leadUserId?: string; memberIds?: string[];
  }): Team {
    return identityPlatform.createTeam({ tenantId, workspaceId, ...params });
  }

  /** Get audit log for tenant */
  public getAuditLog(tenantId: string, limit: number = 50): Record<string, unknown>[] {
    const events = tenantLifecycle.getLifecycleEvents(tenantId);
    return events.slice(-limit).map(e => ({
      id: e.id, action: e.action, status: e.status,
      initiatedBy: e.initiatedBy, timestamp: e.startedAt,
    }));
  }
}

export const tenantConsole = TenantConsole.getInstance();
export default tenantConsole;
