// src/app/api/v1/developer/analytics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { developerPlatform } from '@/platform/developer/DeveloperPlatform';

export async function GET(request: NextRequest) {
  try {
    const analytics = developerPlatform.getAnalytics();
    const usageMetrics = developerPlatform.getUsageMetrics();

    return NextResponse.json({
      analytics,
      usageMetrics,
      timeSeries: [
        { time: "09:00", calls: 12000, errors: 12, latencyMs: 11.2 },
        { time: "10:00", calls: 15400, errors: 18, latencyMs: 12.5 },
        { time: "11:00", calls: 24800, errors: 32, latencyMs: 14.1 },
        { time: "12:00", calls: 20100, errors: 14, latencyMs: 12.0 },
        { time: "13:00", calls: 18900, errors: 15, latencyMs: 11.8 },
        { time: "14:00", calls: 22100, errors: 20, latencyMs: 12.8 }
      ],
      packagePopularity: [
        { id: "com.openclaw.agent.coder", name: "Distinguished Coder Agent", downloads: 1420 },
        { id: "com.openclaw.workflow.compliance-gate", name: "CI/CD Compliance Gate Workflow", downloads: 940 },
        { id: "com.openclaw.plugin.gcs-storage", name: "Google Cloud Storage Plugin", downloads: 310 }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
