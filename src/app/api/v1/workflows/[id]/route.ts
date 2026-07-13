import { NextRequest } from "next/server";
import { workflowRepository } from "@/repositories/workflow.repository";
import { handleCaching } from "@/utils/api-helper";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const workflow = await workflowRepository.getWorkflow(id);
    if (!workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }
    // Also attach execution history dynamically
    const executions = await workflowRepository.getExecutions();
    const runs = executions.filter((exec) => exec.workflowId === id);
    const mappedWorkflow = {
      ...workflow,
      executionHistory: runs.map((r) => ({
        id: r.id,
        status: r.status === "succeeded" ? "succeeded" : r.status === "failed" ? "failed" : "running",
        date: r.startedAt || r.createdAt,
        durationMs: r.durationMs || 0
      }))
    };

    return handleCaching(request, mappedWorkflow);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const existing = await workflowRepository.getWorkflow(id);
    if (!existing) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    const updated = {
      ...existing,
      ...body,
      id, // keep original ID
      updatedAt: new Date().toISOString()
    };

    await workflowRepository.saveWorkflow(updated);
    
    // Log history
    const { userEmail } = body;
    const historyItem = {
      id: `hist-${Math.random().toString(36).substring(2, 8)}`,
      workflowId: id,
      changeType: "update_definition" as const,
      version: updated.version,
      userId: "admin",
      userEmail: userEmail || "admin@openclaw.io",
      details: `Updated workflow definition details and nodes configuration.`,
      timestamp: new Date().toISOString()
    };
    await workflowRepository.saveHistory(historyItem);

    return Response.json({ success: true, workflow: updated });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const deleted = await workflowRepository.deleteWorkflow(id);
    if (!deleted) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
