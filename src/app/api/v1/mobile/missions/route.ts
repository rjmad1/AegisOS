import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    
    const filter = projectId ? { projectId } : {};
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
    }));

    return NextResponse.json(missions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
