import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/sdk/platform-sdk";
import { complianceEngine } from "@/infrastructure/sdk/platform-sdk";
import fs from "fs/promises";
import path from "path";

const AUDIT_FILE_PATH = path.join(process.cwd(), "databases", "event_audit.json");

export async function GET() {
  try {
    // 1. Session statistics
    const activeSessions = await prisma.session.count();

    // 2. Lockout count
    const lockouts = await prisma.securityState.count({
      where: { key: { startsWith: "lockout:" } }
    });

    // 3. Security violations audit log counts
    let securityViolations = 0;
    let totalLogs = 0;

    try {
      const data = await fs.readFile(AUDIT_FILE_PATH, "utf-8");
      const events = JSON.parse(data) as any[];
      totalLogs = events.length;
      securityViolations = events.filter(e => 
        e.eventType === "Security Violation" || 
        e.eventType === "Unauthorized Access" || 
        e.eventType === "Login Failure"
      ).length;
    } catch {
      // Fallback if file missing
      totalLogs = await prisma.auditEvent.count();
      securityViolations = await prisma.auditEvent.count({
        where: {
          eventType: {
            in: ["Security Violation", "Unauthorized Access", "Login Failure"]
          }
        }
      });
    }

    // 4. Compliance Rating Score
    const complianceReport = await complianceEngine.evaluateCompliance();
    let totalScore = 0;
    let standardsCount = 0;
    for (const key of Object.keys(complianceReport)) {
      totalScore += complianceReport[key].score;
      standardsCount++;
    }
    const complianceRating = standardsCount > 0 ? Math.round(totalScore / standardsCount) : 100;

    // 5. Threat Level Index (Normal, Elevated, High, Critical)
    let threatLevel: "Normal" | "Elevated" | "High" | "Critical" = "Normal";
    if (securityViolations > 15 || lockouts > 5) {
      threatLevel = "Critical";
    } else if (securityViolations > 8 || lockouts > 2) {
      threatLevel = "High";
    } else if (securityViolations > 3) {
      threatLevel = "Elevated";
    }

    return NextResponse.json({
      activeSessions,
      lockouts,
      securityViolations,
      totalAuditLogs: totalLogs,
      complianceRating,
      threatLevel,
      lastUpdated: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
