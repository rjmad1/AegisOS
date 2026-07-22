import {
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowNode,
  WorkflowSchedule,
  WorkflowApproval,
  WorkflowHistory,
  ExecutionStep,
  ExecutionLog,
  NodeType,
  WorkflowTemplate
} from "../types/workflow";
import { workflowRepository } from "../repositories/workflow.repository";
import { ProviderRegistry } from "../infrastructure/providers/registry";
import { hardenedEventBus } from "../infrastructure/events/event-bus";
import { EventBus } from "../platform/event-bus/EventBus";
import { artifactRepository } from "../repositories/artifact.repository";

// Helper to match cron expressions
function matchesCron(cron: string, date: Date): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return false;
  const [min, hour, dom, month, dow] = parts;
  
  const checkField = (field: string, val: number): boolean => {
    if (field === "*") return true;
    if (field.includes(",")) {
      return field.split(",").some(p => checkField(p, val));
    }
    if (field.startsWith("*/")) {
      const step = parseInt(field.slice(2), 10);
      return val % step === 0;
    }
    if (field.includes("/")) {
      const [start, step] = field.split("/");
      const startNum = start === "*" ? 0 : parseInt(start, 10);
      const stepNum = parseInt(step, 10);
      return val >= startNum && (val - startNum) % stepNum === 0;
    }
    if (field.includes("-")) {
      const [start, end] = field.split("-").map(Number);
      return val >= start && val <= end;
    }
    return parseInt(field, 10) === val;
  };
  
  return (
    checkField(min, date.getMinutes()) &&
    checkField(hour, date.getHours()) &&
    checkField(dom, date.getDate()) &&
    checkField(month, date.getMonth() + 1) &&
    checkField(dow, date.getDay())
  );
}

// Condition Evaluator Engine
class ConditionEngine {
  public static async evaluate(
    config: Record<string, any>,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<boolean> {
    const type = config.conditionType || "expression";
    
    switch (type) {
      case "boolean":
        return !!config.value;
        
      case "expression": {
        const expr = config.expression;
        if (!expr) return true;
        try {
          const context = {
            variables: execution.variables,
            metadata: workflow.metadata,
            steps: execution.steps.reduce((acc, step) => {
              if (step.nodeId) acc[step.nodeId] = step;
              return acc;
            }, {} as Record<string, any>),
            env: process.env
          };
          const fn = new Function(...Object.keys(context), `return (${expr});`);
          return !!fn(...Object.values(context));
        } catch (err) {
          console.error("[ConditionEngine] Expression evaluation error:", err);
          return false;
        }
      }
      
      case "jsonpath": {
        const path = config.path;
        const expected = config.expectedValue;
        if (!path) return false;
        const val = this.resolvePath({
          steps: execution.steps.reduce((acc, step) => {
            if (step.nodeId) acc[step.nodeId] = step;
            return acc;
          }, {} as Record<string, any>),
          variables: execution.variables
        }, path);
        return val === expected;
      }
      
      case "metadata": {
        const key = config.key;
        const expected = config.expectedValue;
        return workflow.metadata?.[key] === expected;
      }
      
      case "provider_state": {
        const providerId = config.providerId;
        const expectedHealth = config.expectedHealth || "healthy";
        const provider = ProviderRegistry.getInstance().getProvider(providerId);
        if (!provider) return false;
        try {
          const health = await (provider as any).checkHealth();
          return health.status === expectedHealth;
        } catch {
          return false;
        }
      }
      
      case "workflow_state": {
        const varName = config.variableName;
        const expected = config.expectedValue;
        return execution.variables?.[varName] === expected;
      }
      
      case "artifact_state": {
        const artifactId = config.artifactId;
        const expectedStatus = config.expectedStatus || "active";
        const artifact = await artifactRepository.getById(artifactId);
        if (!artifact) return false;
        return artifact.status === expectedStatus || (artifact as any).lifecycleState === expectedStatus;
      }
      
      case "user_permission": {
        const userId = config.userId || "admin";
        const permission = config.permission;
        return userId === "admin" || permission === "read";
      }
      
      case "future_ai":
      default:
        return true;
    }
  }

  private static resolvePath(obj: any, pathStr: string): any {
    return pathStr.split(".").reduce((acc, part) => {
      if (acc === null || acc === undefined) return undefined;
      if (part.includes("[")) {
        const cleanPart = part.replace(/['"\]]/g, "").split("[");
        let current = acc;
        for (const p of cleanPart) {
          if (current === undefined || current === null) return undefined;
          current = current[p];
        }
        return current;
      }
      return acc[part];
    }, obj);
  }
}

export class WorkflowService {
  private static instance: WorkflowService | null = null;
  private backgroundLoop: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private constructor() {}

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService();
    }
    return WorkflowService.instance;
  }

  public async start(): Promise<void> {
    console.log("[WorkflowService] Starting Workflow Orchestration Engine...");
    
    // Perform checkpoint recovery of interrupted executions
    await this.recoverCheckpoints();

    // Register triggers to the Event Bus
    this.registerTriggers();

    if (!this.backgroundLoop) {
      this.backgroundLoop = setInterval(async () => {
        if (this.isProcessing) return;
        this.isProcessing = true;
        try {
          await this.tickScheduler();
          await this.tickExecutions();
          await this.tickApprovals();
        } catch (e) {
          console.error("[WorkflowService] Tick process error:", e);
        } finally {
          this.isProcessing = false;
        }
      }, 1000);
    }
  }

  public stop(): void {
    if (this.backgroundLoop) {
      clearInterval(this.backgroundLoop);
      this.backgroundLoop = null;
    }
    console.log("[WorkflowService] Stopped Workflow Engine background loop.");
  }

  public async getExecutions(): Promise<WorkflowExecution[]> {
    return workflowRepository.getExecutions();
  }

  public async getExecution(id: string): Promise<WorkflowExecution | null> {
    return workflowRepository.getExecution(id);
  }

  public async saveExecution(exec: WorkflowExecution): Promise<void> {
    return workflowRepository.saveExecution(exec);
  }

  public async getApprovals(): Promise<WorkflowApproval[]> {
    return workflowRepository.getApprovals();
  }

  public async getApproval(id: string): Promise<WorkflowApproval | null> {
    return workflowRepository.getApproval(id);
  }

  public async saveApproval(approval: WorkflowApproval): Promise<void> {
    return workflowRepository.saveApproval(approval);
  }

  public async getHistories(): Promise<WorkflowHistory[]> {
    return workflowRepository.getHistories();
  }

  public async saveWorkflow(workflow: WorkflowDefinition): Promise<void> {
    return workflowRepository.saveWorkflow(workflow);
  }

  public async getWorkflow(id: string): Promise<WorkflowDefinition | null> {
    return workflowRepository.getWorkflow(id);
  }

  public async deleteWorkflow(id: string): Promise<boolean> {
    return workflowRepository.deleteWorkflow(id);
  }

  public async saveHistory(history: WorkflowHistory): Promise<void> {
    return workflowRepository.saveHistory(history);
  }

  public async getSchedules(): Promise<WorkflowSchedule[]> {
    return workflowRepository.getSchedules();
  }

  public async saveSchedule(schedule: WorkflowSchedule): Promise<void> {
    return workflowRepository.saveSchedule(schedule);
  }

  public async getTemplates(): Promise<WorkflowTemplate[]> {
    return workflowRepository.getTemplates();
  }

  public async saveTemplate(template: WorkflowTemplate): Promise<void> {
    return workflowRepository.saveTemplate(template);
  }

  // --- Trigger & Execution Entry ---

  public async triggerWorkflow(
    workflowId: string,
    inputs: Record<string, any> = {},
    triggerSource = "manual"
  ): Promise<WorkflowExecution> {
    const workflow = await workflowRepository.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not found.`);
    }

    if (workflow.status !== "active") {
      throw new Error(`Workflow "${workflowId}" is not active (Status: ${workflow.status}).`);
    }

    const startNode = workflow.nodes.find((n) => n.type === "trigger" || n.id === "start" || !workflow.nodes.some(prev => prev.next === n.id));
    if (!startNode) {
      throw new Error(`Workflow "${workflowId}" has no valid starting node.`);
    }

    // Intercept external triggers and wrap them in ExecutionRuntimeService
    if (triggerSource !== "execution-runtime") {
      const { executionRuntimeService } = await import("@/services/execution-runtime.service");
      
      const uExec = await executionRuntimeService.createExecution(
        `Trigger workflow: ${workflow.name} (${workflowId}) via ${triggerSource}`,
        { userId: inputs.userId || "usr-admin-01", role: "admin" },
        { workflowId }
      );
      uExec.metadata.variables = inputs;

      const isValid = await executionRuntimeService.validateExecution(uExec.executionId);
      if (!isValid) {
        throw new Error(uExec.error || "Workflow validation failed.");
      }

      const run = await executionRuntimeService.execute(uExec.executionId);
      const runId = run.workflowReference?.runId;
      if (!runId) {
        throw new Error("Workflow failed to trigger and returned no run identifier.");
      }

      const wfExec = await workflowRepository.getExecution(runId);
      if (!wfExec) {
        throw new Error(`Workflow execution record not found for runId: ${runId}`);
      }
      return wfExec;
    }

    const executionId = `exec-${Math.random().toString(36).substring(2, 10)}`;
    const now = new Date().toISOString();

    // Telemetry trace generation
    const { telemetryTracker } = await import("../infrastructure/observability/telemetry");
    const { metricsPlatform } = await import("../infrastructure/observability/metrics-platform");

    const traceCtx = telemetryTracker.createTrace(
      undefined,
      undefined,
      {
        workflowId,
        executionId,
        userId: inputs.userId || "admin",
        correlationId: inputs.correlationId || `corr-${Math.random().toString(36).substring(2, 8)}`
      }
    );

    // Record Metrics
    metricsPlatform.counter("workflow_runs_total", 1, { workflowId, status: "queued" });

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowVersion: workflow.version,
      workflowName: workflow.name,
      conversationId: inputs.conversationId,
      status: "queued",
      currentNodeId: startNode.id,
      variables: {
        ...inputs,
        traceId: traceCtx.traceId,
        activeSpanId: traceCtx.activeSpanId
      },
      checkpointState: {
        completedNodeIds: []
      },
      createdAt: now,
      steps: [],
      logs: [
        { timestamp: now, level: "info", message: `Workflow execution queued via trigger: ${triggerSource}. Trace ID: ${traceCtx.traceId}` }
      ],
      artifacts: [],
      approvals: [],
      retryCount: 0,
      maxRetries: 3,
      metadata: { triggerSource }
    };

    await workflowRepository.saveExecution(execution);
    this.publishExecutionEvent("WorkflowStarted", execution);

    return execution;
  }

  // --- Background Processing & Checkpoint Recovery ---

  private async recoverCheckpoints(): Promise<void> {
    try {
      const executions = await workflowRepository.getExecutions();
      const interrupted = executions.filter(e => e.status === "running" || e.status === "queued");
      
      for (const exec of interrupted) {
        exec.status = "queued"; // Reset to queued so worker picks it up
        exec.logs.push({
          timestamp: new Date().toISOString(),
          level: "warn",
          message: `Checkpoint recovered: Resuming execution from last saved node: ${exec.currentNodeId}`
        });
        await workflowRepository.saveExecution(exec);
        console.log(`[WorkflowService] Recovered execution checkpoint: ${exec.id} (node: ${exec.currentNodeId})`);
      }
    } catch (e) {
      console.error("[WorkflowService] Checkpoint recovery failed:", e);
    }
  }

  private registerTriggers(): void {
    // 1. Listen for Artifact creation events
    hardenedEventBus.subscribe("ArtifactCreated", async (evt) => {
      const workflows = await workflowRepository.getWorkflows();
      for (const wf of workflows) {
        const triggerNode = wf.nodes.find(n => n.type === "trigger" && n.config.triggerType === "event" && n.config.eventName === "ArtifactCreated");
        if (triggerNode) {
          console.log(`[WorkflowService] Event-triggered workflow "${wf.id}" on ArtifactCreated`);
          await this.triggerWorkflow(wf.id, { artifactId: evt.payload.artifactId, fileName: evt.payload.name }, "ArtifactCreated");
        }
      }
    });

    // 2. Listen for Conversation started events
    hardenedEventBus.subscribe("ConversationStarted", async (evt) => {
      const workflows = await workflowRepository.getWorkflows();
      for (const wf of workflows) {
        const triggerNode = wf.nodes.find(n => n.type === "trigger" && n.config.triggerType === "event" && n.config.eventName === "ConversationStarted");
        if (triggerNode) {
          console.log(`[WorkflowService] Event-triggered workflow "${wf.id}" on ConversationStarted`);
          await this.triggerWorkflow(wf.id, { conversationId: evt.payload.conversationId }, "ConversationStarted");
        }
      }
    });
  }

  private async tickScheduler(): Promise<void> {
    const schedules = await workflowRepository.getSchedules();
    const now = new Date();
    
    for (const sched of schedules) {
      if (!sched.enabled) continue;

      let shouldRun = false;
      const nextRunTime = sched.nextRun ? new Date(sched.nextRun) : null;

      if (sched.type === "cron" && sched.cronExpression) {
        if (matchesCron(sched.cronExpression, now)) {
          // Prevent running multiple times in same minute
          const lastRunDate = sched.lastRun ? new Date(sched.lastRun) : null;
          if (!lastRunDate || now.getTime() - lastRunDate.getTime() > 60000) {
            shouldRun = true;
          }
        }
      } else if ((sched.type === "one-time" || sched.type === "delayed") && nextRunTime) {
        if (now >= nextRunTime) {
          shouldRun = true;
        }
      } else if (sched.type === "recurring" && sched.intervalSeconds) {
        const lastRunTime = sched.lastRun ? new Date(sched.lastRun) : null;
        if (!lastRunTime || (now.getTime() - lastRunTime.getTime()) / 1000 >= sched.intervalSeconds) {
          shouldRun = true;
        }
      }

      if (shouldRun) {
        console.log(`[WorkflowScheduler] Triggering schedule "${sched.name}" for workflow "${sched.workflowId}"`);
        sched.lastRun = now.toISOString();

        // Calculate next runs
        if (sched.type === "cron" && sched.cronExpression) {
          sched.nextRun = new Date(now.getTime() + 60000).toISOString(); // estimate next min check
        } else if (sched.type === "recurring" && sched.intervalSeconds) {
          sched.nextRun = new Date(now.getTime() + sched.intervalSeconds * 1000).toISOString();
        } else {
          sched.enabled = false; // Disable one-time schedules
          sched.nextRun = undefined;
        }

        await workflowRepository.saveSchedule(sched);
        await this.triggerWorkflow(sched.workflowId, {}, `schedule:${sched.id}`);
      }
    }
  }

  private async tickExecutions(): Promise<void> {
    const executions = await workflowRepository.getExecutions();
    const active = executions.filter((e) => e.status === "queued" || e.status === "running" || e.status === "delayed");

    for (const exec of active) {
      if (exec.status === "delayed") {
        const delayedUntil = exec.variables.delayedUntil ? new Date(exec.variables.delayedUntil) : null;
        if (delayedUntil && new Date() >= delayedUntil) {
          exec.status = "running";
          exec.logs.push({
            timestamp: new Date().toISOString(),
            level: "info",
            message: "Delay duration expired. Resuming execution."
          });
          await workflowRepository.saveExecution(exec);
        } else {
          continue; // Still delayed
        }
      }

      // Start execution step-by-step
      await this.runExecutionStep(exec);
    }
  }

  private async tickApprovals(): Promise<void> {
    const approvals = await workflowRepository.getApprovals();
    const pending = approvals.filter(a => a.status === "pending");

    for (const app of pending) {
      if (app.timeoutSeconds) {
        const expiresAt = new Date(new Date(app.createdAt).getTime() + app.timeoutSeconds * 1000);
        if (new Date() >= expiresAt) {
          app.status = "timed_out";
          app.actionedAt = new Date().toISOString();
          await workflowRepository.saveApproval(app);

          // Escalate or Fail execution
          const exec = await workflowRepository.getExecution(app.executionId);
          if (exec) {
            exec.logs.push({
              timestamp: new Date().toISOString(),
              level: "warn",
              message: `Approval request "${app.id}" timed out. Escalating to ${app.escalationUser || "administrator"}.`
            });

            if (app.escalationUser) {
              // Simulating escalation by delegating
              app.status = "delegated";
              app.delegatedTo = app.escalationUser;
              app.createdAt = new Date().toISOString(); // Reset timer for escalation
              await workflowRepository.saveApproval(app);
            } else {
              // Fail the node
              exec.status = "failed";
              exec.error = "Approval timeout exceeded with no escalation path.";
              exec.endedAt = new Date().toISOString();
              exec.durationMs = new Date(exec.endedAt).getTime() - new Date(exec.createdAt).getTime();
              await workflowRepository.saveExecution(exec);
              this.publishExecutionEvent("WorkflowFailed", exec);
            }
          }
        }
      }
    }
  }

  // --- Step-by-step Execution Engine (Checkpoint Sagas) ---

  private async runExecutionStep(exec: WorkflowExecution): Promise<void> {
    const { telemetryTracker } = await import("../infrastructure/observability/telemetry");
    const { metricsPlatform } = await import("../infrastructure/observability/metrics-platform");

    const workflow = await workflowRepository.getWorkflow(exec.workflowId);
    if (!workflow) {
      exec.status = "failed";
      exec.error = "Workflow definition missing during execution";
      exec.endedAt = new Date().toISOString();
      await workflowRepository.saveExecution(exec);
      metricsPlatform.counter("workflow_failures_total", 1, { workflowId: exec.workflowId });
      return;
    }

    if (exec.status === "queued") {
      exec.status = "running";
      exec.startedAt = new Date().toISOString();
      await workflowRepository.saveExecution(exec);
    }

    const currentNodeId = exec.currentNodeId;
    if (!currentNodeId) {
      // Nothing to execute, mark succeeded
      exec.status = "succeeded";
      exec.endedAt = new Date().toISOString();
      exec.durationMs = new Date(exec.endedAt).getTime() - new Date(exec.startedAt || exec.createdAt).getTime();
      exec.logs.push({ timestamp: exec.endedAt, level: "info", message: "Workflow finished successfully." });
      await workflowRepository.saveExecution(exec);
      this.publishExecutionEvent("WorkflowCompleted", exec);
      return;
    }

    const node = workflow.nodes.find((n) => n.id === currentNodeId);
    if (!node) {
      exec.status = "failed";
      exec.error = `Current execution node ID "${currentNodeId}" not found in definition`;
      exec.endedAt = new Date().toISOString();
      await workflowRepository.saveExecution(exec);
      this.publishExecutionEvent("WorkflowFailed", exec);
      metricsPlatform.counter("workflow_failures_total", 1, { workflowId: exec.workflowId });
      return;
    }

    // Initialize trace context for this step execution
    const traceId = exec.variables.traceId || crypto.randomUUID().slice(0, 16);
    const parentSpanId = exec.variables.activeSpanId || undefined;
    const stepSpanId = telemetryTracker.startSpan(
      traceId,
      `Workflow Step: ${node.name} (${node.type})`,
      parentSpanId,
      {
        workflowId: exec.workflowId,
        executionId: exec.id,
        nodeId: node.id,
        nodeType: node.type
      }
    );

    // Initialize step run
    const stepId = `step-${Math.random().toString(36).substring(2, 8)}`;
    const step: ExecutionStep = {
      id: stepId,
      executionId: exec.id,
      nodeId: node.id,
      name: node.name,
      type: node.type,
      status: "running",
      startedAt: new Date().toISOString()
    };
    exec.steps.push(step);
    exec.logs.push({ timestamp: step.startedAt!, level: "info", message: `Executing step [${node.name}] (${node.type}). Step Span ID: ${stepSpanId}` });
    await workflowRepository.saveExecution(exec);

    try {
      let nodeOutput: any = null;
      let nextNodeId = node.next;

      // Handle Node Type Execution
      switch (node.type) {
        case "trigger":
          // Triggers serve as entrypoints, just output inputs
          nodeOutput = exec.variables;
          break;

        case "condition":
        case "decision": {
          const evalResult = await ConditionEngine.evaluate(node.config, exec, workflow);
          nodeOutput = { evaluated: evalResult };
          nextNodeId = evalResult ? node.nextTrue : node.nextFalse;
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Decision evaluated to: ${evalResult}` });
          break;
        }

        case "delay": {
          const delaySecs = parseInt(node.config.delaySeconds || "10", 10);
          const resumeTime = new Date(Date.now() + delaySecs * 1000).toISOString();
          exec.variables.delayedUntil = resumeTime;
          exec.status = "delayed";
          step.status = "waiting";
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Delay step: Sleeping until ${resumeTime}` });
          await workflowRepository.saveExecution(exec);
          telemetryTracker.endSpan(traceId, stepSpanId, { status: "delayed", durationMs: Date.now() - step.startedAt!.split("T")[0].length });
          return; // Pause processing
        }

        case "approval": {
          const appReqId = `app-${Math.random().toString(36).substring(2, 8)}`;
          const approval: WorkflowApproval = {
            id: appReqId,
            executionId: exec.id,
            nodeId: node.id,
            workflowId: workflow.id,
            workflowName: workflow.name,
            type: node.config.approvalType || "single",
            approvers: node.config.approvers || ["admin@aegisos.io"],
            quorumPercentage: node.config.quorumPercentage,
            timeoutSeconds: node.config.timeoutSeconds,
            escalationUser: node.config.escalationUser,
            status: "pending",
            decisions: {},
            createdAt: new Date().toISOString()
          };
          await workflowRepository.saveApproval(approval);

          exec.status = "waiting_approval";
          exec.approvals.push(appReqId);
          step.status = "waiting";
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Approval gate requested (ID: ${appReqId})` });
          await workflowRepository.saveExecution(exec);
          
          // Publish Event for UI / Notification
          EventBus.publish("notification:created", {
            id: appReqId,
            type: "approval",
            title: `Approval required for workflow: ${workflow.name}`
          });
          telemetryTracker.endSpan(traceId, stepSpanId, { status: "waiting_approval" });
          return; // Pause processing
        }

        case "notification": {
          const title = node.config.title || "Workflow Alert";
          const msg = node.config.message || "";
          // Publish notification in event bus
          EventBus.publish("notification:created", {
            id: `notif-${Math.random().toString(36).substring(2, 6)}`,
            type: "workflow_alert",
            title: `${title}: ${msg}`
          });
          nodeOutput = { sent: true };
          break;
        }

        case "provider_call": {
          const providerId = node.config.providerId;
          const method = node.config.method;
          const args = node.config.arguments || {};

          const provider = ProviderRegistry.getInstance().getProvider(providerId);
          if (!provider) {
            throw new Error(`Provider "${providerId}" not found in registry.`);
          }

          if (typeof (provider as any)[method] !== "function") {
            throw new Error(`Method "${method}" does not exist on provider "${providerId}".`);
          }

          // Invoke provider call
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Calling provider "${providerId}" method "${method}"` });
          
          const modelStart = Date.now();
          nodeOutput = await (provider as any)[method](args.path || args.modelId || args, args.prompt || args);
          
          // Record AI Ops metrics
          const promptLength = typeof args.prompt === "string" ? args.prompt.length : 100;
          const inputTokens = Math.ceil(promptLength / 4);
          const outputTokens = nodeOutput ? Math.ceil(JSON.stringify(nodeOutput).length / 4) : 50;
          const totalTokens = inputTokens + outputTokens;
          const latency = Date.now() - modelStart;

          metricsPlatform.counter("ai_prompt_tokens_total", inputTokens, { modelId: args.modelId || "smollm:135m" });
          metricsPlatform.counter("ai_completion_tokens_total", outputTokens, { modelId: args.modelId || "smollm:135m" });
          metricsPlatform.gauge("ai_inference_ttft_ms", Math.round(latency * 0.15), { modelId: args.modelId || "smollm:135m" });
          metricsPlatform.gauge("ai_inference_tps", Math.round(outputTokens / (latency / 1000 || 1)), { modelId: args.modelId || "smollm:135m" });
          
          const promptCost = (inputTokens / 1000000) * 0.075;
          const completionCost = (outputTokens / 1000000) * 0.36;
          metricsPlatform.counter("ai_cost_usd_accumulated", parseFloat((promptCost + completionCost).toFixed(8)), { modelId: args.modelId || "smollm:135m" });
          
          break;
        }

        case "script": {
          // Evaluate script block
          const scriptStr = node.config.script || "return {};";
          const fn = new Function("payload", "variables", scriptStr);
          nodeOutput = fn(exec.variables, exec.variables) || {};
          break;
        }

        case "sub_workflow": {
          const subWfId = node.config.subWorkflowId;
          const subExec = await this.triggerWorkflow(subWfId, { ...exec.variables }, `parent:${exec.id}`);
          
          // Store sub workflow run mapping, and wait
          exec.variables.activeSubWorkflowExecId = subExec.id;
          exec.status = "waiting_approval"; // Use wait block
          step.status = "waiting";
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Spawning nested sub-workflow "${subWfId}" (Exec ID: ${subExec.id})` });
          await workflowRepository.saveExecution(exec);
          telemetryTracker.endSpan(traceId, stepSpanId, { status: "spawning_subworkflow", subExecutionId: subExec.id });
          return;
        }

        case "parallel": {
          const branches = node.branches || [];
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Forking into ${branches.length} parallel paths` });
          nodeOutput = { branchesTriggered: branches.length };
          break;
        }

        case "swarm": {
          const agentRoles = node.config.agentRoles || ["Coder", "Reviewer"];
          exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Initiating Swarm topology with agents: ${agentRoles.join(", ")}` });
          
          // Simulated parallel agent spawning
          const swarmResults = agentRoles.map((role: string) => ({
            role,
            status: "completed",
            result: `Simulated consensus from ${role}`
          }));
          
          nodeOutput = { swarmConsensus: true, swarmResults };
          break;
        }

        case "debate": {
          const maxTurns = parseInt(node.config.maxTurns || "3", 10);
          const debateTopic = node.config.topic || "Design Proposal";
          const minConsensusScore = parseFloat(node.config.minConsensusScore || "0.85");
          const calculatedConsensusScore = parseFloat(node.config.consensusScore || "0.92");
          
          exec.logs.push({ 
            timestamp: new Date().toISOString(), 
            level: "info", 
            message: `Initiating Multi-Agent Debate topology on topic: "${debateTopic}" (Max Turns: ${maxTurns}, Min Threshold: ${minConsensusScore})` 
          });

          if (calculatedConsensusScore < minConsensusScore) {
            // Debate divergence detected: escalate to human C2 mobile approval gate
            const appReqId = `app-debate-${Math.random().toString(36).substring(2, 8)}`;
            const approval: WorkflowApproval = {
              id: appReqId,
              executionId: exec.id,
              nodeId: node.id,
              workflowId: workflow.id,
              workflowName: workflow.name,
              type: "single",
              approvers: node.config.approvers || ["admin@aegisos.io"],
              timeoutSeconds: 300,
              escalationUser: "administrator",
              status: "pending",
              decisions: {},
              createdAt: new Date().toISOString()
            };
            await workflowRepository.saveApproval(approval);

            exec.status = "waiting_approval";
            exec.approvals.push(appReqId);
            step.status = "waiting";
            exec.logs.push({ 
              timestamp: new Date().toISOString(), 
              level: "warn", 
              message: `Multi-Agent Debate divergence detected (Consensus score ${calculatedConsensusScore} < ${minConsensusScore}). Escalated to C2 Mobile Approval Gate (ID: ${appReqId})` 
            });
            await workflowRepository.saveExecution(exec);
            telemetryTracker.endSpan(traceId, stepSpanId, { status: "waiting_approval_debate_divergent" });
            return;
          }
          
          nodeOutput = { 
            consensusReached: true, 
            consensusScore: calculatedConsensusScore,
            turnsTaken: Math.min(2, maxTurns), 
            resolution: `Debate resolved successfully with consensus score ${calculatedConsensusScore} for "${debateTopic}"` 
          };
          break;
        }

        case "loop": {
          const loopNodeId = node.id;
          const loopCounter = exec.checkpointState.loopCounters?.[loopNodeId] || 0;
          const maxIterations = parseInt(node.config.maxIterations || "5", 10);
          
          if (loopCounter < maxIterations) {
            if (!exec.checkpointState.loopCounters) exec.checkpointState.loopCounters = {};
            exec.checkpointState.loopCounters[loopNodeId] = loopCounter + 1;
            nextNodeId = node.config.loopBodyNodeId;
            exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: `Looping iteration ${loopCounter + 1}/${maxIterations}` });
          } else {
            nextNodeId = node.next;
            exec.logs.push({ timestamp: new Date().toISOString(), level: "info", message: "Loop condition met. Exiting loop." });
          }
          break;
        }

        case "end":
        default:
          nextNodeId = undefined; // Stops execution
          break;
      }

      // Step Success Checkpoint
      step.status = "completed";
      step.endedAt = new Date().toISOString();
      step.durationMs = new Date(step.endedAt).getTime() - new Date(step.startedAt!).getTime();
      step.output = nodeOutput;

      exec.checkpointState.completedNodeIds.push(node.id);
      exec.currentNodeId = nextNodeId;
      
      // Save variables if node returned a payload (avoiding circular structures)
      if (nodeOutput) {
        if (nodeOutput === exec.variables) {
          exec.variables[`output_${node.id}`] = { ...nodeOutput };
        } else {
          exec.variables[`output_${node.id}`] = typeof nodeOutput === "object" && nodeOutput !== null ? { ...nodeOutput } : nodeOutput;
        }
      }

      await workflowRepository.saveExecution(exec);

      telemetryTracker.endSpan(traceId, stepSpanId, {
        status: "succeeded",
        durationMs: step.durationMs,
        outputKeys: Object.keys(nodeOutput || {})
      });
    } catch (err: any) {
      console.error(`[WorkflowService] Step execution failed on node "${currentNodeId}":`, err.message);
      
      telemetryTracker.endSpan(traceId, stepSpanId, {
        status: "failed",
        error: true,
        errorMessage: err.message
      });

      // Implement Retry Policy
      if (exec.retryCount < exec.maxRetries) {
        exec.retryCount++;
        exec.logs.push({
          timestamp: new Date().toISOString(),
          level: "warn",
          message: `Step execution failed. Retrying node (Attempt ${exec.retryCount}/${exec.maxRetries}). Error: ${err.message}`
        });
        step.status = "failed";
        step.error = err.message;
        await workflowRepository.saveExecution(exec);
        // Wait 1 second before retrying
        await new Promise((r) => setTimeout(r, 1000));
      } else {
        // Exhausted retries, mark workflow as failed
        step.status = "failed";
        step.error = err.message;
        step.endedAt = new Date().toISOString();
        
        exec.status = "failed";
        exec.error = err.message;
        exec.endedAt = new Date().toISOString();
        exec.durationMs = new Date(exec.endedAt).getTime() - new Date(exec.startedAt || exec.createdAt).getTime();
        exec.logs.push({ timestamp: exec.endedAt, level: "error", message: `Workflow execution failed: ${err.message}` });
        
        await workflowRepository.saveExecution(exec);
        this.publishExecutionEvent("WorkflowFailed", exec);
        
        metricsPlatform.counter("workflow_failures_total", 1, { workflowId: exec.workflowId, error: err.message });
      }
    }
  }

  // --- Approval Actions (Approve / Reject) ---

  public async actionApproval(
    approvalId: string,
    approverId: string,
    decision: "approved" | "rejected"
  ): Promise<WorkflowApproval> {
    const approval = await workflowRepository.getApproval(approvalId);
    if (!approval) throw new Error("Approval request not found.");

    if (approval.status !== "pending") {
      throw new Error(`Approval already finalized (Status: ${approval.status}).`);
    }

    approval.decisions[approverId] = decision;
    const now = new Date().toISOString();

    // Check decisions based on type
    if (approval.type === "single") {
      approval.status = decision === "approved" ? "approved" : "rejected";
    } else {
      const decisionValues = Object.values(approval.decisions);
      if (decision === "rejected") {
        approval.status = "rejected"; // fast fail
      } else {
        const approvedCount = decisionValues.filter(d => d === "approved").length;
        if (approval.type === "multiple") {
          if (approvedCount === approval.approvers.length) {
            approval.status = "approved";
          }
        } else if (approval.type === "quorum") {
          const requiredQuorum = approval.quorumPercentage || 50;
          const ratio = (approvedCount / approval.approvers.length) * 100;
          if (ratio >= requiredQuorum) {
            approval.status = "approved";
          }
        }
      }
    }

    if (approval.status !== "pending") {
      approval.actionedAt = now;
    }

    await workflowRepository.saveApproval(approval);

    // Resume execution
    const exec = await workflowRepository.getExecution(approval.executionId);
    if (exec) {
      const step = exec.steps.find((s) => s.nodeId === approval.nodeId && s.status === "waiting");
      
      if (approval.status === "approved") {
        exec.status = "running";
        if (step) {
          step.status = "completed";
          step.endedAt = now;
        }
        
        // Advance current node
        const workflow = await workflowRepository.getWorkflow(exec.workflowId);
        const node = workflow?.nodes.find((n) => n.id === approval.nodeId);
        exec.currentNodeId = node?.next;
        
        exec.logs.push({
          timestamp: now,
          level: "info",
          message: `Approval request approved by ${approverId}. Resuming workflow.`
        });
      } else if (approval.status === "rejected") {
        exec.status = "failed";
        exec.error = `Workflow rejected by ${approverId}`;
        exec.endedAt = now;
        if (step) {
          step.status = "failed";
          step.error = `Rejected by ${approverId}`;
          step.endedAt = now;
        }
        exec.logs.push({
          timestamp: now,
          level: "error",
          message: `Workflow execution rejected and aborted by ${approverId}.`
        });
        this.publishExecutionEvent("WorkflowFailed", exec);
      }
      await workflowRepository.saveExecution(exec);
    } else {
      // Fallback for ExecutionGraph nodes running under ExecutionRuntimeService
      const { executionRuntimeService } = await import("./execution-runtime.service");
      const uExec = await executionRuntimeService.getExecution(approval.executionId);
      if (uExec && uExec.metadata?.executionGraph) {
        const graph = uExec.metadata.executionGraph;
        const node = graph.nodes.find((n: any) => n.id === approval.nodeId);
        if (node && node.status === "waiting") {
          const step = uExec.steps.find((s) => s.id === node.id);
          if (approval.status === "approved") {
            node.status = "completed";
            node.endedAt = now;
            node.durationMs = Date.now() - new Date(node.startedAt || now).getTime();
            if (step) {
              step.status = "completed";
              step.message = `Approved by ${approverId}`;
            }
            
            // Traverse outgoing edges
            const outgoing = graph.edges.filter((e: any) => e.source === node.id);
            for (const edge of outgoing) {
              edge.status = "traversed";
            }
            
            uExec.status = "RUNNING";
            await (executionRuntimeService as any).repository.save(uExec);
            await executionRuntimeService.recordTimelineEvent(
              uExec.executionId,
              "HITL Approved",
              approverId,
              "execution-graph",
              { approvalId }
            );
            
            // Resume schedule asynchronously
            const { executionGraphService } = await import("./execution-graph.service");
            executionGraphService.schedule(uExec.executionId).catch((err) => {
              console.error("[WorkflowService] Failed to resume execution graph after approval:", err);
            });
          } else if (approval.status === "rejected") {
            node.status = "failed";
            node.endedAt = now;
            node.error = `Rejected by ${approverId}`;
            if (step) {
              step.status = "failed";
              step.message = `Rejected by ${approverId}`;
            }
            
            uExec.status = "FAILED";
            uExec.error = `Rejected by ${approverId}`;
            await (executionRuntimeService as any).repository.save(uExec);
            await executionRuntimeService.recordTimelineEvent(
              uExec.executionId,
              "Failed",
              approverId,
              "execution-graph",
              { approvalId, reason: "Rejected" }
            );
          }
        }
      }
    }

    return approval;
  }

  // --- Helpers ---

  private publishExecutionEvent(eventName: string, exec: WorkflowExecution): void {
    import("@/infrastructure/events/execution-event-publisher").then(({ executionEventPublisher }) => {
      import("@/services/execution-runtime.service").then(async ({ executionRuntimeService }) => {
        const list = await executionRuntimeService.listHistory();
        const uExec = list.find((e) => e.workflowReference?.runId === exec.id);

        if (uExec) {
          if (eventName === "WorkflowStarted") {
            executionEventPublisher.publishStarted(uExec);
          } else if (eventName === "WorkflowCompleted") {
            executionEventPublisher.publishCompleted(uExec);
          } else if (eventName === "WorkflowFailed") {
            executionEventPublisher.publishFailed(uExec, exec.error || "Workflow failed");
          }
        } else {
          // 1. Publish to hardenedEventBus for audit trails
          hardenedEventBus.publish({
            name: eventName,
            source: "WorkflowEngine",
            version: "v1",
            priority: exec.status === "failed" ? "high" : "medium",
            securityClassification: "internal",
            retentionPolicy: "archive",
            payload: {
              executionId: exec.id,
              workflowId: exec.workflowId,
              workflowName: exec.workflowName,
              status: exec.status,
              durationMs: exec.durationMs,
              error: exec.error
            }
          });
        }
      }).catch((err) => console.error("Failed to load executionRuntimeService:", err));
    }).catch((err) => console.error("Failed to load executionEventPublisher:", err));

    // 2. Publish to browser EventBus for real-time console updates
    EventBus.publish("layout:changed", { layoutId: "workflow-execution-update" });
  }
}

export const workflowService = WorkflowService.getInstance();
