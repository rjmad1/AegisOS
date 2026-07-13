// src/app/api/v1/enterprise/tenants/route.ts
// API route for Enterprise Tenant management

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organizationId');
    if (!orgId) {
      return NextResponse.json({ error: 'Missing organizationId parameter' }, { status: 400 });
    }
    const tenants = enterpriseAPI.lifecycle.listTenantsByOrg(orgId);
    return NextResponse.json({ tenants });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = enterpriseAPI.lifecycle.provisionTenant({
      organizationId: body.organizationId,
      name: body.name,
      slug: body.slug,
      environment: body.environment || 'production',
      region: body.region || 'us-east-1',
      tier: body.tier,
      isolationLevel: body.isolationLevel || 'shared',
      initiatedBy: body.initiatedBy || 'system',
    });
    return NextResponse.json({ tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
