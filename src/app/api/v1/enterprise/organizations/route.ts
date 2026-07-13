// src/app/api/v1/enterprise/organizations/route.ts
// API route for Enterprise Organization management

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const orgs = enterpriseAPI.lifecycle.listOrganizations();
    return NextResponse.json({ organizations: orgs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = enterpriseAPI.onboardOrganization({
      name: body.name,
      slug: body.slug,
      displayName: body.displayName || body.name,
      tier: body.tier || 'professional',
      primaryRegion: body.primaryRegion || 'us-east-1',
      adminEmail: body.adminEmail,
      adminName: body.adminName,
      domain: body.domain,
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
