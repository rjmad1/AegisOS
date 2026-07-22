import { NextRequest, NextResponse } from "next/server";
import { autonomicSelfHealingDaemon } from "@/platform/autonomic/AutonomicSelfHealingDaemon";

export async function GET(req: NextRequest) {
  try {
    const result = await autonomicSelfHealingDaemon.runDiagnosticAndRecovery();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Autonomic heal diagnostic failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "heal";

    if (action === "start") {
      autonomicSelfHealingDaemon.start(body.intervalMs || 15000);
      return NextResponse.json({ status: "ok", message: "Autonomic self-healing daemon started" });
    } else if (action === "stop") {
      autonomicSelfHealingDaemon.stop();
      return NextResponse.json({ status: "ok", message: "Autonomic self-healing daemon stopped" });
    }

    const result = await autonomicSelfHealingDaemon.runDiagnosticAndRecovery();
    return NextResponse.json({
      status: "ok",
      diagnostic: result
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to trigger autonomic self-healing" }, { status: 500 });
  }
}
