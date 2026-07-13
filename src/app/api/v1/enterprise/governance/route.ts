// src/app/api/v1/enterprise/governance/route.ts
// API route for Enterprise Governance management

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organizationId');
    if (!orgId) {
      return NextResponse.json({ error: 'Missing organizationId parameter' }, { status: 400 });
    }

    const policies = enterpriseAPI.policies.listPolicies(orgId);
    const frameworks = enterpriseAPI.governance.listComplianceFrameworks();

    return NextResponse.json({ policies, complianceFrameworks: frameworks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'create-policy') {
      const policy = enterpriseAPI.policies.createPolicy({
        organizationId: body.organizationId,
        name: body.name,
        type: body.type,
        configuration: body.configuration,
        enforcementLevel: body.enforcementLevel,
        createdBy: body.createdBy || 'system',
      });
      return NextResponse.json({ status: 'success', policy });
    }

    if (body.action === 'apply-template') {
      const policy = enterpriseAPI.governance.applyPolicyTemplate(
        body.organizationId,
        body.templateName,
        body.createdBy || 'system'
      );
      return NextResponse.json({ status: 'success', policy });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: create-policy, apply-template' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
