// src/app/api/v1/oil/route.ts
import { NextResponse } from 'next/server';
import { platformOILService } from '@/platform/control-plane/oil/PlatformOILService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const brief = await platformOILService.generateDailyBrief();
    const situation = await platformOILService.assessSituation();
    
    return NextResponse.json({
      success: true,
      brief,
      situation,
      timestamp: Date.now()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
