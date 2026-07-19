// src/app/api/v1/observability/route.ts
// Exposes central telemetry diagnostics, self-observability metrics, alerting states, and forecasting items.

import { NextResponse } from "next/server";
import { alertingPlatform } from "@/infrastructure/sdk/platform-sdk";
import { intelligenceEngine } from "@/infrastructure/sdk/platform-sdk";
import { telemetryHealthPlatform } from "@/infrastructure/sdk/platform-sdk";
import { validationFramework } from "@/infrastructure/sdk/platform-sdk";
import { prisma } from "@/infrastructure/sdk/platform-sdk";

export async function GET() {
  try {
    const activeAlerts = alertingPlatform.getActiveAlerts();
    const alertHistory = alertingPlatform.getAlertHistory();
    
    const forecasts = intelligenceEngine.getCapacityForecasts();
    const hotspots = await intelligenceEngine.getHotspots();
    
    const selfHealth = await telemetryHealthPlatform.getSelfObservabilityReport();
    const readiness = await validationFramework.getReadinessReport();
    const gaps = await validationFramework.getGapReport();

    // Query cognitive scorecards from DB (Phase 4/5)
    const scorecards = await prisma.evaluationScorecard.findMany({
      orderBy: { timestamp: "desc" },
      take: 20
    });

    const totalCost = await prisma.evaluationScorecard.aggregate({
      _sum: { costUsd: true }
    });

    const avgGrounding = await prisma.evaluationScorecard.aggregate({
      _avg: { grounding: true }
    });

    const avgLatency = await prisma.evaluationScorecard.aggregate({
      _avg: { latencyMs: true }
    });

    const safetyViolations = await prisma.evaluationScorecard.count({
      where: { safetyViolation: true }
    });

    const totalCalls = await prisma.evaluationScorecard.count();

    return NextResponse.json({
      alerts: {
        active: activeAlerts,
        history: alertHistory
      },
      forecasts,
      hotspots,
      selfHealth,
      readiness,
      gaps,
      cognitive: {
        scorecards,
        stats: {
          totalCalls,
          totalCostUsd: totalCost._sum.costUsd || 0,
          avgGrounding: avgGrounding._avg.grounding || 1.0,
          avgLatencyMs: avgLatency._avg.latencyMs || 0,
          safetyViolations
        }
      }
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
