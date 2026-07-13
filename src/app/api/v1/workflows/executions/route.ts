import { NextRequest } from "next/server";
import { workflowRepository } from "@/repositories/workflow.repository";
import { workflowService } from "@/services/workflow.service";
import { formatErrorResponse } from "@/utils/api-helper";
import { ValidationError, NotFoundError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");

    let list = await workflowRepository.getExecutions();
    if (workflowId) {
      list = list.filter((e) => e.workflowId === workflowId);
    }
    if (status) {
      list = list.filter((e) => e.status === status);
    }
    // Sort reverse chronological
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return Response.json(list);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, workflowId, executionId, variables } = body;

    if (action === "start") {
      if (!workflowId) {
        throw new ValidationError("Missing workflowId to trigger execution");
      }
      const exec = await workflowService.triggerWorkflow(workflowId, variables || {}, "manual");
      return Response.json({ success: true, execution: exec }, { status: 201 });
    }

    if (action === "cancel") {
      if (!executionId) {
        throw new ValidationError("Missing executionId to cancel");
      }
      const exec = await workflowRepository.getExecution(executionId);
      if (!exec) {
        throw new NotFoundError("Execution not found");
      }
      exec.status = "cancelled";
      exec.endedAt = new Date().toISOString();
      exec.logs.push({
        timestamp: exec.endedAt,
        level: "warn",
        message: "Workflow cancelled by manual administrative request."
      });
      await workflowRepository.saveExecution(exec);
      return Response.json({ success: true, execution: exec });
    }

    if (action === "resume") {
      if (!executionId) {
        throw new ValidationError("Missing executionId to resume");
      }
      const exec = await workflowRepository.getExecution(executionId);
      if (!exec) {
        throw new NotFoundError("Execution not found");
      }
      if (exec.status !== "failed" && exec.status !== "cancelled" && exec.status !== "delayed") {
        throw new ValidationError(`Cannot resume execution in status: ${exec.status}`);
      }
      exec.status = "queued";
      exec.logs.push({
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Workflow execution manually resumed."
      });
      await workflowRepository.saveExecution(exec);
      return Response.json({ success: true, execution: exec });
    }

    throw new ValidationError(`Invalid action: ${action}`);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
