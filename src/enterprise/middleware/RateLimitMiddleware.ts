// src/enterprise/middleware/RateLimitMiddleware.ts
// Per-tenant rate limiting middleware based on licensing and subscription tier

import { NextRequest, NextResponse } from 'next/server';
import { TenantContext } from '../tenant/TenantContext';
import { entitlementService } from '../licensing/EntitlementService';

// Simple in-memory sliding window rate limiter
// For multi-instance deployments, this would use Redis
const rateLimitCache = new Map<string, number[]>();

export function rateLimitMiddleware(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const ctx = TenantContext.current();
    if (!ctx || TenantContext.isSystemContext()) {
      return handler(request, ...args); // Bypassed for system/platform
    }

    const tenantId = ctx.tenantId;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    // Retrieve limit from quotas
    const limit = ctx.quotas.maxApiCallsPerMinute || 60;

    // Get current requests window
    if (!rateLimitCache.has(tenantId)) {
      rateLimitCache.set(tenantId, []);
    }
    const timestamps = rateLimitCache.get(tenantId)!;

    // Filter out old timestamps
    const activeTimestamps = timestamps.filter(t => now - t < windowMs);
    rateLimitCache.set(tenantId, activeTimestamps);

    if (activeTimestamps.length >= limit) {
      const resetTime = timestamps[0] + windowMs;
      const retryAfterSeconds = Math.max(1, Math.round((resetTime - now) / 1000));

      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `API rate limit of ${limit} requests per minute exceeded for tenant ${tenantId}.`,
          limit,
          remaining: 0,
          resetInSeconds: retryAfterSeconds,
        },
        { status: 429 }
      );

      response.headers.set('Retry-After', retryAfterSeconds.toString());
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', Math.round(resetTime / 1000).toString());

      return response;
    }

    // Record request timestamp
    activeTimestamps.push(now);

    // Call downstream handler
    const response = await handler(request, ...args);

    // Add headers to response
    const remaining = Math.max(0, limit - activeTimestamps.length);
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.round((now + windowMs) / 1000).toString());

    return response;
  };
}

export default rateLimitMiddleware;
