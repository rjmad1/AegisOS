// src/app/api/v1/oil/predictions/route.ts
import { NextResponse } from 'next/server';
import { platformOILService } from '@/platform/control-plane/oil/PlatformOILService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const predictions = await platformOILService.getPredictions();
    return NextResponse.json({ success: true, predictions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
