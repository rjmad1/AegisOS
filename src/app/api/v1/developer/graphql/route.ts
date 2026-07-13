// src/app/api/v1/developer/graphql/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { developerPlatform } from '@/platform/developer/DeveloperPlatform';

export async function POST(request: NextRequest) {
  try {
    const { query, variables } = await request.json();
    const cleanQuery = (query || '').replace(/\s+/g, ' ').trim();

    let data: any = {};

    if (cleanQuery.includes('query GetMarketplace') || cleanQuery.includes('marketplaceItems')) {
      data = {
        marketplaceItems: developerPlatform.getMarketplaceItems().map(item => ({
          id: item.id,
          name: item.name,
          version: item.version,
          type: item.type,
          description: item.description,
          author: item.author,
          ratingsAverage: item.ratingsAverage,
          pricingType: item.pricingType,
          price: item.price
        }))
      };
    } else if (cleanQuery.includes('query GetExtensionPoints') || cleanQuery.includes('extensionPoints')) {
      data = {
        extensionPoints: developerPlatform.getExtensionPoints()
      };
    } else if (cleanQuery.includes('mutation InstallItem') || cleanQuery.includes('installItem')) {
      const id = variables?.id || 'com.openclaw.agent.coder';
      const installed = developerPlatform.installMarketplaceItem(id, 'tenant-default');
      data = {
        installItem: {
          success: true,
          item: installed
        }
      };
    } else {
      // Default general schema response
      data = {
        schema: {
          types: ['Query', 'Mutation', 'MarketplaceItem', 'ExtensionPoint', 'Review'],
          queries: ['marketplaceItems', 'extensionPoints', 'itemDetail'],
          mutations: ['installItem', 'submitReview']
        }
      };
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({
      errors: [{ message: err.message, locations: [], path: [] }]
    }, { status: 400 });
  }
}
