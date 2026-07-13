// src/enterprise/middleware/EntitlementMiddleware.ts
// Middleware and decorators for real-time feature gate checking and quota enforcement

import { NextRequest, NextResponse } from 'next/server';
import { entitlementService } from '../licensing/EntitlementService';
import { TenantContext } from '../tenant/TenantContext';

// ============================================================================
// Route Handler Wrapper for Feature Entitlement
// ============================================================================
// Guards a Route Handler to ensure the tenant has access to the specified feature.

export function withFeature(
  feature: string,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const ctx = TenantContext.current();
    if (!ctx) {
      return NextResponse.json(
        { error: 'Tenant Context Required', message: 'This route requires a valid tenant context.' },
        { status: 400 }
      );
    }

    const check = entitlementService.checkFeature(feature, ctx.tenantId);
    if (!check.entitled) {
      return NextResponse.json(
        {
          error: 'Feature Not Entitled',
          message: check.reason || `Your plan (${check.tier}) does not include access to "${feature}".`,
          feature,
          tier: check.tier,
          upgradeRequired: true,
        },
        { status: 402 } // Payment Required
      );
    }

    return handler(request, ...args);
  };
}

// ============================================================================
// Route Handler Wrapper for Quota Enforcement
// ============================================================================
// Guards a Route Handler to ensure the tenant has not exceeded a usage quota.

export function withQuota(
  metric: string,
  requestedAmount: number = 1,
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const ctx = TenantContext.current();
    if (!ctx) {
      return NextResponse.json(
        { error: 'Tenant Context Required', message: 'This route requires a valid tenant context.' },
        { status: 400 }
      );
    }

    const check = entitlementService.checkQuota(metric, requestedAmount, ctx.tenantId);
    if (check.exceeded) {
      return NextResponse.json(
        {
          error: 'Quota Exceeded',
          message: `Quota limit of ${check.limit} reached for metric "${metric}". Current usage: ${check.used}.`,
          metric,
          limit: check.limit,
          used: check.used,
          requested: requestedAmount,
        },
        { status: 429 } // Too Many Requests
      );
    }

    return handler(request, ...args);
  };
}
