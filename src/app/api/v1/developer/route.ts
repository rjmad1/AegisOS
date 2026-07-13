// src/app/api/v1/developer/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { developerPlatform } from '@/platform/developer/DeveloperPlatform';

export async function GET(request: NextRequest) {
  try {
    const points = developerPlatform.getExtensionPoints();
    const analytics = developerPlatform.getAnalytics();

    return NextResponse.json({
      name: "OpenClaw Developer Platform API",
      version: "1.0.0",
      status: "ready",
      endpoints: {
        rest: "/api/v1/developer",
        graphql: "/api/v1/developer/graphql",
        grpc: "/api/v1/developer/grpc",
        sse: "/api/v1/developer/sse",
        marketplace: "/api/v1/developer/marketplace",
        certification: "/api/v1/developer/certification",
        analytics: "/api/v1/developer/analytics"
      },
      sdks: [
        { language: "TypeScript", path: "/sdks/openclaw-sdk.ts" },
        { language: "Python", path: "/sdks/openclaw_sdk.py" },
        { language: "Go", path: "/sdks/openclaw-sdk.go" },
        { language: "DotNet", path: "/sdks/OpenClawSdk.cs" },
        { language: "Java", path: "/sdks/OpenClawClient.java" }
      ],
      registryCounts: {
        extensionPoints: points.length,
        marketplaceItems: developerPlatform.getMarketplaceItems().length
      },
      analytics
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
