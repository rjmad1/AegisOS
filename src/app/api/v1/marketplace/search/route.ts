import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/platform/marketplace/MarketplaceService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const text = url.searchParams.get('query') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const trustLevelStr = url.searchParams.get('trustLevel');
    const trustLevel = trustLevelStr ? parseInt(trustLevelStr, 10) : undefined;

    const items = await marketplaceService.search({ text, type, trustLevel });
    return NextResponse.json({
      success: true,
      items
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
