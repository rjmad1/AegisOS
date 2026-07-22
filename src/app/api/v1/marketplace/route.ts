import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/platform/marketplace/MarketplaceService';

export async function GET(request: NextRequest) {
  try {
    const items = await marketplaceService.search({});
    return NextResponse.json({
      name: "AegisOS Marketplace API",
      status: "online",
      totalCount: items.length,
      endpoints: {
        search: "/api/v1/marketplace/search",
        publish: "/api/v1/marketplace/publish",
        install: "/api/v1/marketplace/install"
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
