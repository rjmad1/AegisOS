import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/sdk/platform-sdk";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;

    const records = await prisma.universalExecution.findMany({
      orderBy: { createdAt: "desc" },
    });

    let executions = records.map(r => ({
      id: r.id,
      executionId: r.executionId,
      status: r.status,
      createdAt: r.createdAt,
      startedAt: r.startedAt,
      endedAt: r.endedAt,
      durationMs: r.durationMs,
      priority: r.priority,
      intent: r.intent ? JSON.parse(r.intent) : {},
      steps: r.steps ? JSON.parse(r.steps) : [],
      timeline: r.timeline ? JSON.parse(r.timeline) : [],
      projectContext: r.projectContext ? JSON.parse(r.projectContext) : {},
    }));

    if (projectId) {
      executions = executions.filter(e => e.projectContext?.projectId === projectId);
    }

    return NextResponse.json(executions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
