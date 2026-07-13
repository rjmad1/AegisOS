// src/app/api/v1/developer/marketplace/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { developerPlatform } from '@/platform/developer/DeveloperPlatform';
import { eventBus } from '@/infrastructure/events/event-bus';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || undefined;
    const items = developerPlatform.getMarketplaceItems(type);

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, tenantId, rating, comment, userEmail } = body;

    if (action === 'install') {
      if (!id) {
        return NextResponse.json({ error: "Marketplace item ID is required." }, { status: 400 });
      }
      const item = developerPlatform.installMarketplaceItem(id, tenantId || 'tenant-default');
      
      // Publish event
      await eventBus.publish({
        name: 'MarketplaceItemInstalled',
        source: 'api:marketplace',
        version: 'v1',
        priority: 'medium',
        securityClassification: 'internal',
        retentionPolicy: 'temp',
        payload: { itemId: id, tenantId: tenantId || 'tenant-default', timestamp: Date.now() }
      });

      return NextResponse.json({ success: true, message: `Successfully installed ${item.name}`, item });
    }

    if (action === 'review') {
      if (!id || rating === undefined) {
        return NextResponse.json({ error: "Item ID and rating are required." }, { status: 400 });
      }
      const item = developerPlatform.getMarketplaceItem(id);
      if (!item) {
        return NextResponse.json({ error: "Marketplace item not found." }, { status: 404 });
      }

      const review = {
        id: `rev-${Math.random().toString(36).slice(2, 9)}`,
        userId: 'usr-current',
        userEmail: userEmail || 'user@example.com',
        rating,
        comment: comment || '',
        timestamp: new Date().toISOString()
      };

      item.reviews.push(review);
      item.ratingsCount = item.reviews.length;
      item.ratingsAverage = Number((item.reviews.reduce((acc, curr) => acc + curr.rating, 0) / item.reviews.length).toFixed(1));

      // Publish event
      await eventBus.publish({
        name: 'MarketplaceReviewSubmitted',
        source: 'api:marketplace',
        version: 'v1',
        priority: 'low',
        securityClassification: 'public',
        retentionPolicy: 'temp',
        payload: { itemId: id, reviewId: review.id, rating }
      });

      return NextResponse.json({ success: true, message: "Review submitted successfully", item });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
