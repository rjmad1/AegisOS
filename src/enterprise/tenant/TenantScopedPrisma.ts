// src/enterprise/tenant/TenantScopedPrisma.ts
// Prisma client wrapper that auto-injects tenant filtering into every query

import { TenantContext, SYSTEM_TENANT_ID } from './TenantContext';

// ============================================================================
// Tenant-Scoped Prisma Client
// ============================================================================
// Wraps the standard Prisma client to automatically inject `tenantId` and
// `organizationId` filters into queries, preventing cross-tenant data access.
//
// Design: Uses Prisma middleware pattern. Every `findMany`, `findFirst`,
// `findUnique`, `create`, `update`, `delete` etc. is intercepted.
// ============================================================================

/** Models that are tenant-scoped (have tenantId column) */
const TENANT_SCOPED_MODELS = new Set([
  'User', 'Artifact', 'Workflow', 'WorkflowTemplate', 'WorkflowExecution',
  'WorkflowSchedule', 'WorkflowApproval', 'WorkflowHistory',
  'AuditLogEntry', 'AuditEvent', 'Config', 'ConfigHistory',
  'FeatureFlag', 'Secret', 'SchedulerJob', 'Job', 'JobCheckpoint', 'Session',
  // Enterprise models
  'Tenant', 'Workspace', 'Project', 'Department', 'BusinessUnit',
  'License', 'Subscription', 'UsageRecord', 'Invoice',
  'GovernancePolicy', 'WhiteLabelConfig',
]);

/** Models that are organization-scoped (have organizationId but may span tenants) */
const ORG_SCOPED_MODELS = new Set([
  'Organization', 'OrganizationInvitation', 'OrganizationPolicy',
]);

/** Models that are platform-global (no tenant scoping) */
const GLOBAL_MODELS = new Set([
  'Region', 'PlatformConfig', 'RolePermission', 'SecurityState',
]);

export interface TenantFilter {
  tenantId: string;
  organizationId: string;
}

/**
 * Get the current tenant filter from the async context.
 * Returns null for system context (allows cross-tenant access).
 */
export function getCurrentTenantFilter(): TenantFilter | null {
  const ctx = TenantContext.current();
  if (!ctx) return null;
  if (ctx.tenantId === SYSTEM_TENANT_ID) return null; // System context bypasses filtering
  return {
    tenantId: ctx.tenantId,
    organizationId: ctx.organizationId,
  };
}

/**
 * Apply tenant scoping to a Prisma query's `where` clause.
 * Injects tenantId automatically, preventing cross-tenant data access.
 */
export function applyTenantScope(model: string, args: any): any {
  if (GLOBAL_MODELS.has(model)) return args;

  const filter = getCurrentTenantFilter();
  if (!filter) return args; // No context or system context

  if (TENANT_SCOPED_MODELS.has(model)) {
    if (!args) args = {};
    if (!args.where) args.where = {};
    args.where.tenantId = filter.tenantId;
    return args;
  }

  if (ORG_SCOPED_MODELS.has(model)) {
    if (!args) args = {};
    if (!args.where) args.where = {};
    args.where.organizationId = filter.organizationId;
    return args;
  }

  return args;
}

/**
 * Inject tenantId and organizationId into create/update data payloads.
 */
export function injectTenantData(model: string, args: any): any {
  if (GLOBAL_MODELS.has(model)) return args;

  const filter = getCurrentTenantFilter();
  if (!filter) return args;

  if (TENANT_SCOPED_MODELS.has(model)) {
    if (args?.data) {
      if (!args.data.tenantId) args.data.tenantId = filter.tenantId;
      if (!args.data.organizationId) args.data.organizationId = filter.organizationId;
    }
    return args;
  }

  if (ORG_SCOPED_MODELS.has(model)) {
    if (args?.data) {
      if (!args.data.organizationId) args.data.organizationId = filter.organizationId;
    }
    return args;
  }

  return args;
}

/**
 * Prisma middleware function that hooks into every database operation.
 * Install via: prisma.$use(tenantScopeMiddleware)
 */
export async function tenantScopeMiddleware(
  params: { model?: string; action: string; args: any },
  next: (params: any) => Promise<any>,
): Promise<any> {
  const model = params.model;
  if (!model) return next(params);

  // Read operations: inject tenant filter
  const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'];
  if (readActions.includes(params.action)) {
    params.args = applyTenantScope(model, params.args);
  }

  // Write operations: inject tenant data + filter
  const writeActions = ['create', 'createMany', 'upsert'];
  if (writeActions.includes(params.action)) {
    params.args = injectTenantData(model, params.args);
  }

  // Update/Delete operations: inject tenant filter to prevent cross-tenant mutation
  const mutateActions = ['update', 'updateMany', 'delete', 'deleteMany'];
  if (mutateActions.includes(params.action)) {
    params.args = applyTenantScope(model, params.args);
  }

  return next(params);
}

/**
 * Validate that a tenant filter is active before allowing a query.
 * Use this as a guard in sensitive operations.
 */
export function requireTenantScope(): TenantFilter {
  const filter = getCurrentTenantFilter();
  if (!filter) {
    throw new Error(
      '[TenantScopedPrisma] Tenant scope required but not available. ' +
      'Ensure the request has passed through TenantMiddleware.'
    );
  }
  return filter;
}

/**
 * Utility: Check if a model is tenant-scoped.
 */
export function isTenantScopedModel(model: string): boolean {
  return TENANT_SCOPED_MODELS.has(model);
}

/**
 * Utility: Check if a model is organization-scoped.
 */
export function isOrgScopedModel(model: string): boolean {
  return ORG_SCOPED_MODELS.has(model);
}

export default tenantScopeMiddleware;
