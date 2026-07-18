import { NextRequest, NextResponse } from "next/server";
import { missionRuntimeService } from "@/services/mission-runtime.service";
import prisma from "@/infrastructure/db/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const record = await prisma.mission.findUnique({
      where: { id },
    });
    if (!record) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }
    const mission = {
      id: record.id,
      name: record.name,
      status: record.status,
      goals: record.goals ? JSON.parse(record.goals) : [],
      constraints: record.constraints ? JSON.parse(record.constraints) : [],
      confidence: record.confidence,
      metrics: record.metrics ? JSON.parse(record.metrics) : {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      workspaceId: record.workspaceId,
      projectId: record.projectId,
      activeExecutionId: record.activeExecutionId,
      history: record.history ? JSON.parse(record.history) : [],
      decisions: record.decisions ? JSON.parse(record.decisions) : [],
      artifacts: record.artifacts ? JSON.parse(record.artifacts) : [],
      evaluations: record.evaluations ? JSON.parse(record.evaluations) : [],
      lessons: record.lessons ? JSON.parse(record.lessons) : [],
    };
    return NextResponse.json(mission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action } = await req.json();
    const mission = await missionRuntimeService.getMission(id);
    if (!mission) {
      return NextResponse.json({ error: "Mission not found" }, { status: 404 });
    }

    if (action === "execute" || action === "resume") {
      mission.status = "EXECUTING";
      // Run in the background
      missionRuntimeService.executeMission(id).catch((err) => {
        console.error(`[MissionsAPI] Failed to run/resume mission ${id}:`, err.message);
      });
      return NextResponse.json({ success: true, status: "EXECUTING" });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
