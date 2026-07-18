// src/app/api/v1/oil/rca/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformOILService } from '@/platform/control-plane/oil/PlatformOILService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || 'digital twin unhealthy';
    const report = await platformOILService.getRCAReport(query);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query || 'digital twin unhealthy';
    const report = await platformOILService.getRCAReport(query);
    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
