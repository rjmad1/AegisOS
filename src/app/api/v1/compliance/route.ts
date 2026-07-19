import { NextResponse } from "next/server";
import { complianceEngine } from "@/infrastructure/sdk/platform-sdk";

export async function GET() {
  try {
    const report = await complianceEngine.evaluateCompliance();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
