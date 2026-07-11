import { NextResponse } from "next/server";
import { selfHealer } from "@/infrastructure/diagnostics/self-healer";

export async function GET() {
  const report = await selfHealer.executeDiagnosticsAndHeal();
  return NextResponse.json(report);
}

export async function POST() {
  const report = await selfHealer.executeDiagnosticsAndHeal();
  return NextResponse.json({
    success: true,
    message: "Self-healing loop triggered and completed.",
    report
  });
}
