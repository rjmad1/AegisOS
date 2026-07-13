import { WorkflowDefinition, WorkflowExecutionState } from "./types";
import prisma from "../../infrastructure/db/prisma";

export class WorkflowRuntime {
  private static instance: WorkflowRuntime | null = null;
  private workflows: Map<string, WorkflowDefinition> = new Map();

  private constructor() {
    this.seedDefaultWorkflows();
  }

  public static getInstance(): WorkflowRuntime {
    if (!WorkflowRuntime.instance) {
      WorkflowRuntime.instance = new WorkflowRuntime();
    }
    return WorkflowRuntime.instance;
  }

  private seedDefaultWorkflows(): void {
    const defaultWorkflows: WorkflowDefinition[] = [
      {
        id: "wf:workspace-audit",
        name: "Developer Workspace Audit Workflow",
        version: "1.0.0",
        steps: [
          {
            id: "step-1-scan",
            name: "Scan Project Files",
            type: "task",
            config: { targetDir: "src/app" },
          },
          {
            id: "step-2-validate",
            name: "Validate C4 Architecture compliance",
            type: "agent",
            config: { agentId: "critic", template: "prompt:agent:critic" },
            compensationStepId: "step-2-rollback",
          },
          {
            id: "step-2-rollback",
            name: "Rollback file changes & clear warnings",
            type: "tool",
            config: { action: "clear-cache" },
          },
          {
            id: "step-3-deploy",
            name: "Deploy Build & Launch Sandbox",
            type: "tool",
            config: { command: "npm run build" },
          },
        ],
        variables: { mode: "audit", status: "pending" },
      },
    ];

    for (const wf of defaultWorkflows) {
      this.registerWorkflow(wf);
    }
  }

  public registerWorkflow(def: WorkflowDefinition): void {
    this.workflows.set(def.id, def);
  }

  public getWorkflow(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public async getExecution(id: string): Promise<WorkflowExecutionState | undefined> {
    try {
      const record = await prisma.workflowExecution.findUnique({
        where: { id }
      });
      if (!record) return undefined;

      return {
        id: record.id,
        workflowId: record.workflowId,
        status: record.status as "queued" | "running" | "succeeded" | "failed" | "compensated",
        variables: JSON.parse(record.variables),
        checkpointState: JSON.parse(record.checkpointState),
        logs: JSON.parse(record.logs),
        stepResults: JSON.parse(record.artifacts || "{}"), // Mapping step results to artifacts slot
        startedAt: record.startedAt || record.createdAt,
        endedAt: record.endedAt || undefined,
        currentStepId: record.currentNodeId || undefined
      };
    } catch (e) {
      console.error("[WorkflowRuntime] Failed to read execution from database:", e);
      return undefined;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async startExecution(workflowId: string, variables: Record<string, any>): Promise<WorkflowExecutionState> {
    const wf = this.getWorkflow(workflowId);
    if (!wf) {
      throw new Error(`WorkflowRuntime: Workflow "${workflowId}" not found.`);
    }

    const execState: WorkflowExecutionState = {
      id: `exec:${workflowId}:${Date.now()}`,
      workflowId,
      status: "queued",
      variables: { ...wf.variables, ...variables },
      checkpointState: {},
      logs: [`[${new Date().toISOString()}] Workflow execution initialized. Status: QUEUED.`],
      stepResults: {},
      startedAt: new Date().toISOString(),
    };

    // Save to database
    try {
      await prisma.workflowExecution.create({
        data: {
          id: execState.id,
          workflowId: execState.workflowId,
          workflowVersion: wf.version,
          workflowName: wf.name,
          status: execState.status,
          variables: JSON.stringify(execState.variables),
          checkpointState: JSON.stringify(execState.checkpointState),
          createdAt: execState.startedAt,
          startedAt: execState.startedAt,
          logs: JSON.stringify(execState.logs),
          steps: JSON.stringify(wf.steps),
          artifacts: JSON.stringify(execState.stepResults),
          approvals: JSON.stringify([]),
          retryCount: 0,
          maxRetries: 3,
          metadata: JSON.stringify({}),
          organizationId: "__system__",
          tenantId: "__system__"
        }
      });
    } catch (e) {
      console.error("[WorkflowRuntime] DB transaction write failed for startExecution:", e);
    }

    return execState;
  }

  public async runWorkflow(executionId: string): Promise<WorkflowExecutionState> {
    const exec = await this.getExecution(executionId);
    if (!exec) throw new Error(`Execution not found: ${executionId}`);

    const wf = this.getWorkflow(exec.workflowId)!;
    exec.status = "running";
    exec.logs.push(`[${new Date().toISOString()}] Started execution run.`);

    await this.updateExecutionInDb(exec);

    for (let i = 0; i < wf.steps.length; i++) {
      const step = wf.steps[i];
      if (step.id.includes("rollback")) continue; // Skip compensation steps during forward execution

      exec.currentStepId = step.id;
      exec.logs.push(`[${new Date().toISOString()}] Running step "${step.name}" (${step.id}).`);
      
      // Transaction Boundary: Save state checkpoint *before* executing node
      await this.checkpoint(executionId, { currentStepIndex: i, executingNode: step.id });

      try {
        if (exec.variables.failOnStep === step.id) {
          throw new Error(`Simulated step failure at ${step.id}`);
        }

        exec.stepResults[step.id] = { success: true, timestamp: Date.now() };
        exec.logs.push(`[${new Date().toISOString()}] Step "${step.name}" completed successfully.`);
        
        // Save success progress checkpoint
        await this.checkpoint(executionId, { lastSuccessfulStepIndex: i, executingNode: null });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        exec.logs.push(`[${new Date().toISOString()}] FATAL: Step "${step.name}" failed: ${errMsg}`);
        exec.status = "failed";
        exec.endedAt = new Date().toISOString();
        await this.updateExecutionInDb(exec);
        
        // Execute Saga Compensation Rollback (which updates DB status to compensated)
        await this.compensateSaga(executionId, i);
        
        // Reload final state from database
        const finalExec = await this.getExecution(executionId);
        if (finalExec) {
          Object.assign(exec, finalExec);
        }
        return exec;
      }
    }

    exec.status = "succeeded";
    exec.logs.push(`[${new Date().toISOString()}] Workflow execution succeeded.`);
    exec.endedAt = new Date().toISOString();
    exec.currentStepId = undefined;
    
    await this.updateExecutionInDb(exec);
    return exec;
  }

  public async compensateSaga(executionId: string, failedStepIndex: number): Promise<void> {
    const exec = await this.getExecution(executionId);
    if (!exec) return;

    const wf = this.getWorkflow(exec.workflowId)!;

    exec.logs.push(`[${new Date().toISOString()}] Initiating Saga Compensation rollback sequence...`);
    exec.status = "compensated";

    await this.updateExecutionInDb(exec);

    // Compensate executed steps in reverse order
    for (let i = failedStepIndex; i >= 0; i--) {
      const step = wf.steps[i];
      if (step.compensationStepId) {
        const compStep = wf.steps.find((s) => s.id === step.compensationStepId);
        if (compStep) {
          exec.logs.push(`[${new Date().toISOString()}] Compensating step "${step.name}": Running "${compStep.name}"`);
          exec.stepResults[compStep.id] = { compensated: true, timestamp: Date.now() };
          await this.checkpoint(executionId, { compensationInProgress: compStep.id });
        }
      }
    }

    exec.logs.push(`[${new Date().toISOString()}] Saga compensation complete. Platform state restored.`);
    await this.updateExecutionInDb(exec);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async checkpoint(executionId: string, variables: Record<string, any>): Promise<void> {
    const exec = await this.getExecution(executionId);
    if (exec) {
      exec.checkpointState = {
        ...exec.checkpointState,
        ...variables,
        timestamp: Date.now(),
        currentStepId: exec.currentStepId,
      };
      await this.updateExecutionInDb(exec);
    }
  }

  private async updateExecutionInDb(exec: WorkflowExecutionState): Promise<void> {
    try {
      await prisma.workflowExecution.update({
        where: { id: exec.id },
        data: {
          status: exec.status,
          currentNodeId: exec.currentStepId || null,
          variables: JSON.stringify(exec.variables),
          checkpointState: JSON.stringify(exec.checkpointState),
          logs: JSON.stringify(exec.logs),
          artifacts: JSON.stringify(exec.stepResults),
          endedAt: exec.endedAt || null
        }
      });
    } catch (e) {
      console.error(`[WorkflowRuntime] Failed to update execution ${exec.id} in DB:`, e);
    }
  }
}
export default WorkflowRuntime;
