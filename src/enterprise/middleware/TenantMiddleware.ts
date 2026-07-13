// src/enterprise/middleware/TenantMiddleware.ts
// Request-scoped tenant context resolution and propagation middleware for Next.js

import { NextRequest, NextResponse } from 'next/server';
import { tenantResolver } from '../tenant/TenantResolver';
import { TenantContext } from '../tenant/TenantContext';
import type { TenantContextData } from '../tenant/types';
import { tenantLifecycle } from '../tenant/TenantLifecycle';

// ============================================================================
// Next.js Global Middleware Helper
// ============================================================================
// Resolves the tenant from the request and injects x-tenant-id and related
// headers. If the tenant is suspended or deleted, returns 403/404.

export async function tenantMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const hostname = request.nextUrl.hostname;
  const url = request.url;
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((val, key) => {
    headers[key] = val;
  });

  const resolved = await tenantResolver.resolve({
    hostname,
    url,
    headers,
  });

  if (!resolved) {
    // For platform routes or public files, let it pass
    return null;
  }

  // Check tenant status
  const tenant = tenantLifecycle.getTenant(resolved.tenantId);
  if (tenant) {
    if (tenant.status === 'suspended') {
      return NextResponse.json(
        { error: 'Tenant Suspended', message: 'Your organization has been suspended. Please contact support.' },
        { status: 403 }
      );
    }
    if (tenant.status === 'archived') {
      return NextResponse.json(
        { error: 'Tenant Archived', message: 'Your organization has been archived.' },
        { status: 403 }
      );
    }
    if (tenant.status === 'deleted') {
      return NextResponse.json(
        { error: 'Tenant Not Found', message: 'The requested tenant does not exist.' },
        { status: 404 }
      );
    }
  }

  // Inject resolved tenant headers so Route Handlers can read them
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', resolved.tenantId);
  response.headers.set('x-organization-id', resolved.organizationId);
  // Add workspaceId to result if present (optional on TenantDiscoveryResult)
  const discoveryResult = resolved as any;
  if (discoveryResult.workspaceId) {
    response.headers.set('x-workspace-id', discoveryResult.workspaceId);
  }
  return response;
}

// ============================================================================
// Route Handler Wrapper (AsyncLocalStorage Propagation)
// ============================================================================
// Wraps a Next.js Route Handler and runs it within TenantContext.run(),
// enabling request-scoped tenant propagation to Prisma and all services.

export function withTenantContext<T = any>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse<T>> => {
    // 1. Resolve tenant details from headers (injected by middleware) or request
    const tenantId = request.headers.get('x-tenant-id') || request.nextUrl.searchParams.get('tenantId') || 'default';
    const organizationId = request.headers.get('x-organization-id') || request.nextUrl.searchParams.get('organizationId') || 'default';
    const workspaceId = request.headers.get('x-workspace-id') || request.nextUrl.searchParams.get('workspaceId') || null;

    // In a real DB setup, we would fetch the tenant details to get quotas/tier/region.
    // For this engine, we query the TenantLifecycle manager.
    const tenant = tenantLifecycle.getTenant(tenantId);

    const ctx: TenantContextData = {
      organizationId,
      tenantId,
      workspaceId,
      userId: request.headers.get('x-user-id') || 'system',
      roles: (request.headers.get('x-user-roles')?.split(',') as any[]) || ['member'],
      tier: tenant?.tier ?? 'free',
      region: tenant?.region ?? 'us-east-1',
      isolationLevel: tenant?.isolationLevel ?? 'shared',
      permissions: [], // Would be resolved by RoleHierarchyService
      featureFlags: {},
      quotas: tenant?.resourceQuotas ?? {
        maxStorageBytes: 1e9,
        maxAiTokensPerMonth: 100000,
        maxApiCallsPerMinute: 60,
        maxConcurrentWorkflows: 2,
        maxAgents: 2,
        maxKnowledgeBases: 1,
        maxPlugins: 3,
        maxCustomModels: 0,
      },
    };

    // 2. Propagate context using AsyncLocalStorage
    return TenantContext.run(ctx, () => {
      return handler(request, ...args);
    });
  };
}

export default withTenantContext;
