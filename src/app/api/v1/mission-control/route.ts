// src/app/api/v1/mission-control/route.ts
import { NextRequest, NextResponse } from "next/server";
import { missionControlPlatform } from "@/platform/control/MissionControlPlatform";

export async function GET() {
  try {
    const report = await missionControlPlatform.getReport();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actionType, recommendationId, action } = await req.json();

    if (actionType === "run-governance") {
      const report = await missionControlPlatform.executeGovernanceCycle();
      return NextResponse.json({ success: true, report });
    }

    if (actionType === "action-recommendation") {
      if (!recommendationId || !action) {
        return NextResponse.json({ error: "Missing recommendationId or action parameter." }, { status: 400 });
      }
      const recs = missionControlPlatform.actionRecommendation(recommendationId, action);
      return NextResponse.json({ success: true, recommendations: recs });
    }

    return NextResponse.json({ error: `Unknown actionType: ${actionType}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
