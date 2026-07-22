import { NextRequest, NextResponse } from 'next/server';
import { marketplaceService } from '@/platform/marketplace/MarketplaceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json({ error: "Missing required field itemId." }, { status: 400 });
    }

    const result = await marketplaceService.install(itemId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
