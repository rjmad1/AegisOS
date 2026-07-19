import { NextRequest } from "next/server";
import { workflowService } from "@/services/workflow.service";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import { formatErrorResponse } from "@/utils/api-helper";
import { ValidationError, NotFoundError } from "@/utils/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const status = searchParams.get("status");

    let list = await workflowService.getExecutions();
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

      // 1. Create execution
      const execution = await executionRuntimeService.createExecution(
        "Trigger workflow: " + workflowId,
        { userId: "usr-admin-01", role: "admin" },
        { workflowId }
      );
      execution.metadata.variables = variables || {};

      // 2. Validate
      const isValid = await executionRuntimeService.validateExecution(execution.executionId);
      if (!isValid) {
        const finalExec = (await executionRuntimeService.getExecution(execution.executionId))!;
        throw new Error(finalExec.error || "Workflow failed safety validation.");
      }

      // 3. Execute
      await executionRuntimeService.execute(execution.executionId);

      const finalExec = (await executionRuntimeService.getExecution(execution.executionId))!;
      const runId = finalExec.workflowReference?.runId;
      if (!runId) {
        throw new Error("Workflow failed to trigger and returned no run identifier.");
      }

      const workflowExecution = await workflowService.getExecution(runId);
      return Response.json({ success: true, execution: workflowExecution }, { status: 201 });
    }

    if (action === "cancel") {
      if (!executionId) {
        throw new ValidationError("Missing executionId to cancel");
      }

      // Handle Universal Execution Cancellation
      if (executionId.startsWith("exec-")) {
        const exec = await executionRuntimeService.cancelExecution(executionId, "Manual administrative cancellation");
        // Also cancel referenced workflow if present
        const runId = exec.workflowReference?.runId;
        if (runId) {
          const wfExec = await workflowService.getExecution(runId);
          if (wfExec) {
            wfExec.status = "cancelled";
            wfExec.endedAt = new Date().toISOString();
            wfExec.logs.push({
              timestamp: wfExec.endedAt,
              level: "warn",
              message: "Workflow cancelled by manual administrative request."
            });
            await workflowService.saveExecution(wfExec);
          }
        }
        return Response.json({ success: true, execution: exec });
      }

      const exec = await workflowService.getExecution(executionId);
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
      await workflowService.saveExecution(exec);
      return Response.json({ success: true, execution: exec });
    }

    if (action === "resume") {
      if (!executionId) {
        throw new ValidationError("Missing executionId to resume");
      }
      const exec = await workflowService.getExecution(executionId);
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
      await workflowService.saveExecution(exec);
      return Response.json({ success: true, execution: exec });
    }

    throw new ValidationError(`Invalid action: ${action}`);
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
