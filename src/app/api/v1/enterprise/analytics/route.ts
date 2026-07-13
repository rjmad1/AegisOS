// src/app/api/v1/enterprise/analytics/route.ts
// API route for Enterprise Platform Analytics

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organizationId');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (tenantId) {
      const tenantStats = enterpriseAPI.analytics.getTenantAnalytics(tenantId);
      return NextResponse.json(tenantStats);
    }

    if (orgId) {
      const orgStats = enterpriseAPI.analytics.getOrganizationAnalytics(orgId);
      return NextResponse.json(orgStats);
    }

    // Default to full platform dashboard
    const fullDashboard = enterpriseAPI.getDashboard();
    return NextResponse.json(fullDashboard);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
