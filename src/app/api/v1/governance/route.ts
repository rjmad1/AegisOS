import { NextResponse } from "next/server";
import { fitnessChecker } from "@/infrastructure/governance/fitness-checks";

export async function GET() {
  const report = fitnessChecker.runChecks();
  return NextResponse.json(report);
}
