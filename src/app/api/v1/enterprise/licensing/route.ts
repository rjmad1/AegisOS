// src/app/api/v1/enterprise/licensing/route.ts
// API route for Enterprise License management

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId');
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenantId parameter' }, { status: 400 });
    }
    const validation = enterpriseAPI.licensing.validate(tenantId);
    return NextResponse.json(validation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === 'activate') {
      const activation = enterpriseAPI.licensing.activateLicense(body.licenseKey, {
        tenantId: body.tenantId,
        activatedBy: body.activatedBy || 'system',
        hardwareFingerprint: body.hardwareFingerprint,
        ipAddress: body.ipAddress,
      });
      return NextResponse.json({ status: 'success', activation });
    }

    if (body.action === 'create') {
      const license = enterpriseAPI.licensing.createLicense({
        organizationId: body.organizationId,
        tenantId: body.tenantId,
        type: body.type || 'subscription',
        tier: body.tier || 'professional',
        seats: body.seats,
        durationDays: body.durationDays || 30,
      });
      return NextResponse.json({ status: 'success', license });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: activate, create' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
