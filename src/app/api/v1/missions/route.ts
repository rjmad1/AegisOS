import { NextRequest, NextResponse } from "next/server";
import { missionRuntimeService } from "@/services/mission-runtime.service";
import { prisma } from "@/infrastructure/sdk/platform-sdk";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const workspaceId = searchParams.get("workspaceId") || undefined;

    const filter: any = {};
    if (projectId) filter.projectId = projectId;
    if (workspaceId) filter.workspaceId = workspaceId;

    const records = await prisma.mission.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
    });

    const missions = records.map(r => ({
      id: r.id,
      name: r.name,
      status: r.status,
      goals: r.goals ? JSON.parse(r.goals) : [],
      constraints: r.constraints ? JSON.parse(r.constraints) : [],
      confidence: r.confidence,
      metrics: r.metrics ? JSON.parse(r.metrics) : {},
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      workspaceId: r.workspaceId,
      projectId: r.projectId,
      activeExecutionId: r.activeExecutionId,
    }));

    return NextResponse.json(missions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, constraints, workspaceId, projectId } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }

    // 1. Create the mission
    const mission = await missionRuntimeService.createMission(prompt, constraints, { workspaceId, projectId });

    // 2. Trigger execution asynchronously in the background
    missionRuntimeService.executeMission(mission.id).catch((err) => {
      console.error(`[MissionsAPI] Background execution failed for mission ${mission.id}:`, err.message);
    });

    return NextResponse.json(mission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
