import { NextResponse } from "next/server";
import { fitnessChecker } from "@/infrastructure/governance/fitness-checks";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
  const metricsPath = path.resolve(dbDir, "governance_metrics.json");

  let metricsData: any = {};
  if (fs.existsSync(metricsPath)) {
    try {
      let raw = fs.readFileSync(metricsPath, "utf-8");
      if (raw.charCodeAt(0) === 0xFEFF) {
        raw = raw.slice(1);
      }
      metricsData = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse governance metrics:", e);
    }
  }

  const fitness = fitnessChecker.runChecks();

  return NextResponse.json({
    ...metricsData,
    fitness,
    timestamp: new Date().toISOString()
  });
}
