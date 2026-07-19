import { NextRequest } from "next/server";
import { workflowService } from "@/services/workflow.service";

export async function GET(request: NextRequest) {
  try {
    const list = await workflowService.getSchedules();
    return Response.json(list);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, workflowId, name, type, cronExpression, intervalSeconds, runAt, enabled } = body;

    if (!workflowId || !name || !type) {
      return Response.json({ error: "Missing required fields: workflowId, name, type" }, { status: 400 });
    }

    const schedId = id || `sched-${Math.random().toString(36).substring(2, 8)}`;
    const schedule = {
      id: schedId,
      workflowId,
      name,
      type,
      cronExpression,
      intervalSeconds: intervalSeconds ? parseInt(intervalSeconds, 10) : undefined,
      runAt,
      enabled: enabled !== false,
      lastRun: body.lastRun,
      nextRun: body.nextRun || runAt
    };

    await workflowService.saveSchedule(schedule);
    return Response.json({ success: true, schedule });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
