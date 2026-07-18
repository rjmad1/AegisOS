// src/app/api/v1/oil/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformOILService } from '@/platform/control-plane/oil/PlatformOILService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recommendations = await platformOILService.getRecommendations();
    return NextResponse.json({ success: true, recommendations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json({ success: false, error: 'Remediation action parameter is missing.' }, { status: 400 });
    }

    const result = await platformOILService.executeRemediation(action);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
