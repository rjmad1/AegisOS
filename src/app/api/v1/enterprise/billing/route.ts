// src/app/api/v1/enterprise/billing/route.ts
// API route for Enterprise Billing management

import { NextRequest, NextResponse } from 'next/server';
import { enterpriseAPI } from '@/enterprise/api/EnterpriseAPI';

export async function GET(request: NextRequest) {
  try {
    const orgId = request.nextUrl.searchParams.get('organizationId');
    const tenantId = request.nextUrl.searchParams.get('tenantId');

    if (orgId) {
      const chargeback = enterpriseAPI.billing.getChargebackReport(orgId);
      const invoices = enterpriseAPI.billing.listInvoices(orgId);
      return NextResponse.json({ chargeback, invoices });
    }

    if (tenantId) {
      const spend = enterpriseAPI.billing.getCostAllocation(tenantId);
      const usage = enterpriseAPI.metering.getUsageSummary(tenantId);
      return NextResponse.json({ costAllocation: spend, usageSummary: usage });
    }

    return NextResponse.json({ error: 'Missing organizationId or tenantId parameter' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'invoice') {
      const invoice = enterpriseAPI.billing.generateInvoice({
        organizationId: body.organizationId,
        tenantId: body.tenantId,
        subscriptionId: body.subscriptionId,
        periodStart: body.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        periodEnd: body.periodEnd || new Date().toISOString(),
      });
      return NextResponse.json({ status: 'success', invoice });
    }

    if (body.action === 'budget') {
      const budget = enterpriseAPI.billing.createBudget({
        tenantId: body.tenantId,
        organizationId: body.organizationId,
        name: body.name,
        limitCents: body.limitCents,
        alertThresholds: body.alertThresholds,
        hardCap: body.hardCap,
        period: body.period,
      });
      return NextResponse.json({ status: 'success', budget });
    }

    if (body.action === 'record-usage') {
      const record = enterpriseAPI.metering.record({
        tenantId: body.tenantId,
        organizationId: body.organizationId,
        category: body.category,
        metric: body.metric,
        quantity: body.quantity,
        metadata: body.metadata,
      });
      return NextResponse.json({ status: 'success', record });
    }

    return NextResponse.json({ error: 'Invalid action. Supported: invoice, budget, record-usage' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
