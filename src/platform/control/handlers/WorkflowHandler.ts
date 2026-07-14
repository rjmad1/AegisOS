import { WorkflowRuntime } from "../../ai-runtime/WorkflowRuntime";
import prisma from "../../../infrastructure/db/prisma";
import { rollbackEngine } from "../RollbackEngine";

export class WorkflowHandler {
  public async execute(type: string, payload: Record<string, any>, commandId: string): Promise<any> {
    const runtime = WorkflowRuntime.getInstance();
    const workflowId = payload.workflowId;
    const executionId = payload.executionId;

    switch (type) {
      case "workflow:execute": {
        if (!workflowId) throw new Error("workflowId is required for workflow execution.");
        const variables = payload.variables || {};
        
        const state = await runtime.startExecution(workflowId, variables);
        
        // Register rollback: Mark execution as cancelled/failed
        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await prisma.workflowExecution.update({
            where: { id: state.id },
            data: { status: "cancelled", endedAt: new Date().toISOString() },
          });
        });

        return { status: "started", executionId: state.id, workflowId };
      }

      case "workflow:pause": {
        if (!executionId) throw new Error("executionId is required.");
        
        const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
        if (!execution) throw new Error(`Execution ${executionId} not found.`);
        if (execution.status !== "running") throw new Error(`Execution state is ${execution.status}, cannot pause.`);

        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "paused" },
        });

        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: "running" },
          });
        });

        return { status: "paused", executionId };
      }

      case "workflow:resume": {
        if (!executionId) throw new Error("executionId is required.");

        const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
        if (!execution) throw new Error(`Execution ${executionId} not found.`);
        if (execution.status !== "paused") throw new Error(`Execution state is ${execution.status}, cannot resume.`);

        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "running" },
        });

        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: "paused" },
          });
        });

        return { status: "resumed", executionId };
      }

      case "workflow:cancel": {
        if (!executionId) throw new Error("executionId is required.");

        const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
        if (!execution) throw new Error(`Execution ${executionId} not found.`);

        const previousStatus = execution.status;
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "cancelled", endedAt: new Date().toISOString() },
        });

        rollbackEngine.registerInMemoryRollback(commandId, async () => {
          await prisma.workflowExecution.update({
            where: { id: executionId },
            data: { status: previousStatus, endedAt: null },
          });
        });

        return { status: "cancelled", executionId };
      }

      case "workflow:retry": {
        if (!executionId) throw new Error("executionId is required.");
        
        // Find existing execution and clone it or restart it
        const execution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
        if (!execution) throw new Error(`Execution ${executionId} not found.`);

        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: { status: "running", startedAt: new Date().toISOString(), endedAt: null, retryCount: execution.retryCount + 1 },
        });

        return { status: "retried", executionId, retries: execution.retryCount + 1 };
      }

      default:
        throw new Error(`Unsupported Workflow command type: ${type}`);
    }
  }
}

export const workflowHandler = new WorkflowHandler();
