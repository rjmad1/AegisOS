// src/app/api/v1/oil/timeline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { platformOILService } from '@/platform/control-plane/oil/PlatformOILService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'all';
    const events = await platformOILService.getTimeline(category);
    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
