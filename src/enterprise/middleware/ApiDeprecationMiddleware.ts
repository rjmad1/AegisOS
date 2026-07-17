import { NextRequest, NextResponse } from 'next/server';

/**
 * API Deprecation Middleware
 * 
 * Implements Release Governance Standard ERG-2026-001.
 * Injects `X-API-Deprecation-Date` headers for routes marked as deprecated.
 */
export class ApiDeprecationMiddleware {
  // Map of deprecated API paths to their deprecation dates
  private static readonly DEPRECATED_ROUTES: Record<string, string> = {
    '/api/v1/legacy-search': '2026-10-01',
    '/api/v1/old-models': '2026-11-15'
  };

  public static apply(req: NextRequest, res: NextResponse): void {
    const pathname = req.nextUrl.pathname;
    
    // Check if path is deprecated
    for (const [route, date] of Object.entries(this.DEPRECATED_ROUTES)) {
      if (pathname.startsWith(route)) {
        res.headers.set('X-API-Deprecation-Date', date);
        res.headers.set('X-Deprecation-Warning', 'This API endpoint is deprecated and will be removed in a future release.');
      }
    }
  }
}
