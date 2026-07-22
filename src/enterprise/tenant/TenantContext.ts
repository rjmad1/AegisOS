// src/enterprise/tenant/TenantContext.ts
// Request-scoped tenant context using AsyncLocalStorage

import { AsyncLocalStorage } from 'async_hooks';
import type { TenantContextData, TenantTier, RegionCode, IsolationLevel, ResourceQuotas } from './types';

// ============================================================================
// AsyncLocalStorage instance — provides request-scoped tenant propagation
// without passing tenant through every function signature.
// ============================================================================

const StorageClass = (typeof AsyncLocalStorage === 'function')
  ? AsyncLocalStorage
  : class DummyLocalStorage<T> {
      private store: T | undefined;
      run<R>(store: T, callback: () => R): R {
        const prev = this.store;
        this.store = store;
        try {
          return callback();
        } finally {
          this.store = prev;
        }
      }
      getStore(): T | undefined {
        return this.store;
      }
    };

const tenantStorage = new StorageClass<TenantContextData>();

// ============================================================================
// System Tenant — Used for platform-level operations not scoped to any tenant
// ============================================================================

const SYSTEM_TENANT_CONTEXT: TenantContextData = {
  organizationId: '__system__',
  tenantId: '__system__',
  workspaceId: null,
  userId: '__system__',
  roles: ['platform-admin'],
  tier: 'enterprise' as TenantTier,
  region: 'us-east-1' as RegionCode,
  isolationLevel: 'shared' as IsolationLevel,
  permissions: ['*'],
  featureFlags: {},
  quotas: {
    maxStorageBytes: Number.MAX_SAFE_INTEGER,
    maxAiTokensPerMonth: Number.MAX_SAFE_INTEGER,
    maxApiCallsPerMinute: Number.MAX_SAFE_INTEGER,
    maxConcurrentWorkflows: Number.MAX_SAFE_INTEGER,
    maxAgents: Number.MAX_SAFE_INTEGER,
    maxKnowledgeBases: Number.MAX_SAFE_INTEGER,
    maxPlugins: Number.MAX_SAFE_INTEGER,
    maxCustomModels: Number.MAX_SAFE_INTEGER,
  },
};

export class TenantContext {
  /**
   * Run a function within a specific tenant context.
   * All downstream code can access the tenant via TenantContext.current().
   */
  static run<T>(context: TenantContextData, fn: () => T): T {
    return tenantStorage.run(context, fn);
  }

  /**
   * Run an async function within a specific tenant context.
   */
  static async runAsync<T>(context: TenantContextData, fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run(context, fn);
  }

  /**
   * Get the current tenant context. Returns null if no context is set
   * (e.g., during startup, background jobs not yet scoped).
   */
  static current(): TenantContextData | null {
    return tenantStorage.getStore() ?? null;
  }

  /**
   * Get the current tenant context or throw if not in a tenant scope.
   * Use this in code paths that MUST have a tenant context.
   */
  static require(): TenantContextData {
    const ctx = tenantStorage.getStore();
    if (!ctx) {
      throw new Error(
        '[TenantContext] No tenant context available. This code path requires a tenant scope. ' +
        'Ensure the request passes through TenantMiddleware or use TenantContext.runAsSystem() for platform operations.'
      );
    }
    return ctx;
  }

  /**
   * Get the current tenant ID or throw.
   */
  static requireTenantId(): string {
    return TenantContext.require().tenantId;
  }

  /**
   * Get the current organization ID or throw.
   */
  static requireOrganizationId(): string {
    return TenantContext.require().organizationId;
  }

  /**
   * Get the current workspace ID (may be null if not workspace-scoped).
   */
  static getWorkspaceId(): string | null {
    return TenantContext.current()?.workspaceId ?? null;
  }

  /**
   * Check if the current context is the system tenant (platform operations).
   */
  static isSystemContext(): boolean {
    const ctx = TenantContext.current();
    return ctx?.tenantId === '__system__';
  }

  /**
   * Run a function as the system tenant. Used for platform-level operations
   * (e.g., cross-tenant queries, billing aggregation, admin operations).
   */
  static runAsSystem<T>(fn: () => T): T {
    return tenantStorage.run(SYSTEM_TENANT_CONTEXT, fn);
  }

  /**
   * Run an async function as the system tenant.
   */
  static async runAsSystemAsync<T>(fn: () => Promise<T>): Promise<T> {
    return tenantStorage.run(SYSTEM_TENANT_CONTEXT, fn);
  }

  /**
   * Create a child context with a specific workspace scope.
   */
  static withWorkspace(workspaceId: string): TenantContextData {
    const current = TenantContext.require();
    return { ...current, workspaceId };
  }

  /**
   * Check if the current tenant has a specific feature flag enabled.
   */
  static hasFeature(flagName: string): boolean {
    const ctx = TenantContext.current();
    if (!ctx) return false;
    return ctx.featureFlags[flagName] === true;
  }

  /**
   * Check if the current context has a specific permission.
   */
  static hasPermission(permission: string): boolean {
    const ctx = TenantContext.current();
    if (!ctx) return false;
    if (ctx.permissions.includes('*')) return true;
    return ctx.permissions.includes(permission);
  }

  /**
   * Check if the current context has a specific role.
   */
  static hasRole(role: string): boolean {
    const ctx = TenantContext.current();
    if (!ctx) return false;
    return ctx.roles.includes(role);
  }

  /**
   * Get a snapshot of the current tenant context for logging/auditing.
   * Strips sensitive fields.
   */
  static snapshot(): Record<string, unknown> {
    const ctx = TenantContext.current();
    if (!ctx) return { tenant: 'none' };
    return {
      organizationId: ctx.organizationId,
      tenantId: ctx.tenantId,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      tier: ctx.tier,
      region: ctx.region,
    };
  }
}

export const SYSTEM_TENANT_ID = '__system__';
export const SYSTEM_ORG_ID = '__system__';
export default TenantContext;
