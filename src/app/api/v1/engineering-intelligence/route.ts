// src/app/api/v1/engineering-intelligence/route.ts
// Exposes Engineering Intelligence Platform endpoints (PHI, EMI, correlations, predictions, prioritized queue, and decisions).

import { NextResponse } from "next/server";
import { engineeringIntelligenceService } from "@/services/engineering-intelligence.service";
import { recommendationEngine } from "@/infrastructure/intelligence/recommendation-engine";

export async function GET() {
  try {
    const summary = await engineeringIntelligenceService.runIntelligenceAnalysis();
    return NextResponse.json(summary);
  } catch (err: any) {
    console.error("[EipAPI] GET scan error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, feedback } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required parameters: id and action" }, { status: 400 });
    }

    const success = recommendationEngine.updateRecommendationStatus(id, action, feedback);
    if (!success) {
      return NextResponse.json({ error: `Recommendation with ID '${id}' not found` }, { status: 404 });
    }

    // Force rerun service analysis to update cached/persisted recommendation statuses
    const updatedSummary = await engineeringIntelligenceService.runIntelligenceAnalysis();

    return NextResponse.json({
      success: true,
      message: `Recommendation '${id}' successfully updated to status '${action}'`,
      summary: updatedSummary
    });
  } catch (err: any) {
    console.error("[EipAPI] POST action error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
