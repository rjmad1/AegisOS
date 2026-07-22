import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/platform/marketplace/MarketplaceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { manifest, signature } = body;

    if (!manifest || !manifest.id || !manifest.version) {
      return NextResponse.json({ error: "Missing package manifest or required fields (id, version)." }, { status: 400 });
    }

    const result = await marketplaceService.publish(manifest, signature || "");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
