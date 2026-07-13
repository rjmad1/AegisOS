// src/app/api/v1/observability/route.ts
// Exposes central telemetry diagnostics, self-observability metrics, alerting states, and forecasting items.

import { NextResponse } from "next/server";
import { alertingPlatform } from "@/infrastructure/observability/alerting-platform";
import { intelligenceEngine } from "@/infrastructure/observability/intelligence-engine";
import { telemetryHealthPlatform } from "@/infrastructure/observability/telemetry-health";
import { validationFramework } from "@/infrastructure/observability/validation-framework";

export async function GET() {
  try {
    const activeAlerts = alertingPlatform.getActiveAlerts();
    const alertHistory = alertingPlatform.getAlertHistory();
    
    const forecasts = intelligenceEngine.getCapacityForecasts();
    const hotspots = await intelligenceEngine.getHotspots();
    
    const selfHealth = await telemetryHealthPlatform.getSelfObservabilityReport();
    const readiness = await validationFramework.getReadinessReport();
    const gaps = await validationFramework.getGapReport();

    return NextResponse.json({
      alerts: {
        active: activeAlerts,
        history: alertHistory
      },
      forecasts,
      hotspots,
      selfHealth,
      readiness,
      gaps
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Support executing root cause analyses on specific trace ID
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { traceId } = body;
    if (!traceId) {
      return NextResponse.json({ error: "Missing traceId parameter" }, { status: 400 });
    }
    const rca = intelligenceEngine.getRootCauseAnalysis(traceId);
    return NextResponse.json({ rca });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
