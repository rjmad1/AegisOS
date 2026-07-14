import prisma from "../../infrastructure/db/prisma";
import { commandRouter } from "./CommandRouter";
import { auditEngine } from "./AuditEngine";
import { approvalEngine } from "./ApprovalEngine";
import { eventBus } from "../../infrastructure/events/event-bus";
import { metricsPlatform } from "../../infrastructure/observability/metrics-platform";

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export class ExecutionEngine {
  private static instance: ExecutionEngine | null = null;
  private isRunning = false;
  private loopInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine();
    }
    return ExecutionEngine.instance;
  }

  /**
   * Starts the background execution workers and scheduler
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log("[ExecutionEngine] Initializing background execution worker loops...");

    this.loopInterval = setInterval(async () => {
      try {
        await this.processQueue();
        await this.processScheduler();
        await approvalEngine.checkExpirations();
      } catch (err: any) {
        console.error("[ExecutionEngine] Loop execution error:", err.message);
      }
    }, 1000);
  }

  /**
   * Stops the background execution workers
   */
  public stop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    this.isRunning = false;
    console.log("[ExecutionEngine] Background execution workers stopped.");
  }

  /**
   * Enqueues a command (triggering a single process run immediately)
   */
  public async enqueueCommand(commandId: string): Promise<void> {
    await prisma.command.update({
      where: { id: commandId },
      data: { status: "QUEUED" },
    });
    
    // Broadcast status change
    this.broadcastCommandUpdate(commandId, "QUEUED");

    // Execute immediately in background
    if (process.env.NODE_ENV !== "test") {
      setImmediate(() => this.processQueue());
    }
  }

  /**
   * Fetches, sorts, and executes queued tasks in order of priority (Priority Queue)
   */
  public async processQueue(): Promise<void> {
    try {
      // 1. Fetch all queued commands that are ready to run
      const queued = await prisma.command.findMany({
        where: {
          status: "QUEUED",
          approvalStatus: { in: ["APPROVED", "BYPASSED", "AUTO"] },
          OR: [
            { nextAttemptAt: null },
            { nextAttemptAt: { lte: new Date() } },
          ],
        },
      });

      // Update Queue Length metric
      metricsPlatform.gauge("c2_queue_length", queued.length);

      if (queued.length === 0) return;

      // 2. Sort by priority desc, then FIFO by createdAt
      queued.sort((a, b) => {
        const pA = PRIORITY_ORDER[a.priority] || 0;
        const pB = PRIORITY_ORDER[b.priority] || 0;
        if (pA !== pB) return pB - pA;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // 3. Process the highest-priority command
      const target = queued[0];
      await this.executeCommand(target.id);
    } catch (err: any) {
      console.error("[ExecutionEngine:Queue] Processing queue failed:", err.message);
    }
  }

  /**
   * Triggers actions for commands whose scheduled execution times have arrived
   */
  private async processScheduler(): Promise<void> {
    try {
      // Find commands that were scheduled but are in "QUEUED" status with past scheduledAt date
      // which are not yet running or pending approval
      const scheduled = await prisma.command.findMany({
        where: {
          status: "QUEUED",
          scheduledAt: { lte: new Date() },
          startedAt: null,
        },
      });

      for (const cmd of scheduled) {
        // Enqueue them to make sure nextAttemptAt gets evaluated immediately
        await prisma.command.update({
          where: { id: cmd.id },
          data: { nextAttemptAt: null },
        });
      }
    } catch (e: any) {
      console.error("[ExecutionEngine:Scheduler] Scheduler run failed:", e.message);
    }
  }

  /**
   * Executes a command, handles retries with backoff, shunts to DLQ, and audits lifecycle
   */
  private async executeCommand(commandId: string): Promise<void> {
    const cmd = await prisma.command.findUnique({ where: { id: commandId } });
    if (!cmd || cmd.status !== "QUEUED") return;

    // 1. Mark command as RUNNING
    await prisma.command.update({
      where: { id: commandId },
      data: { status: "RUNNING", startedAt: new Date() },
    });
    this.broadcastCommandUpdate(commandId, "RUNNING");

    const user = cmd.userId ? { id: cmd.userId, email: cmd.userEmail || "" } : null;
    await auditEngine.logCommandExecutionStart(commandId, cmd.type, user, cmd.origin);

    const startTime = Date.now();

    try {
      const payload = JSON.parse(cmd.payload || "{}");
      
      // 2. Invoke Router
      const result = await commandRouter.routeAndExecute(cmd.type, payload, commandId);
      
      const duration = Date.now() - startTime;

      // 3. Update Success State
      await prisma.command.update({
        where: { id: commandId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          durationMs: duration,
          result: JSON.stringify(result),
        },
      });
      this.broadcastCommandUpdate(commandId, "COMPLETED");

      // Log success metrics
      metricsPlatform.gauge("c2_execution_time_ms", duration, { type: cmd.type });
      metricsPlatform.counter("c2_success_rate_total", 1, { type: cmd.type });
      
      // Calculate approval time if manual/multi-stage
      if (cmd.approvalType !== "AUTO" && cmd.createdAt) {
        const approvalTime = Date.now() - new Date(cmd.createdAt).getTime();
        metricsPlatform.gauge("c2_approval_time_ms", approvalTime, { type: cmd.type });
      }

      await auditEngine.logCommandCompletion(commandId, cmd.type, duration, user, cmd.origin);
    } catch (err: any) {
      const duration = Date.now() - startTime;
      metricsPlatform.counter("c2_failure_rate_total", 1, { type: cmd.type });

      // 4. Handle Failure / Retry Policy
      const currentRetry = cmd.retryCount;
      const maxRetries = cmd.maxRetries;

      if (currentRetry < maxRetries) {
        // Exponential backoff: retry after retryCount * 5 seconds
        const backoffSeconds = (currentRetry + 1) * 5;
        const nextAttempt = new Date(Date.now() + backoffSeconds * 1000);

        await prisma.command.update({
          where: { id: commandId },
          data: {
            status: "QUEUED",
            retryCount: currentRetry + 1,
            nextAttemptAt: nextAttempt,
            errorMessage: err.message,
          },
        });
        this.broadcastCommandUpdate(commandId, "QUEUED");
        
        metricsPlatform.counter("c2_retry_count_total", 1);
        await auditEngine.logCommandFailure(
          commandId,
          cmd.type,
          `Attempt ${currentRetry + 1} failed: ${err.message}. Retrying in ${backoffSeconds}s.`,
          user,
          cmd.origin
        );
      } else {
        // Shunt to Dead Letter Queue (Status becomes FAILED)
        await prisma.command.update({
          where: { id: commandId },
          data: {
            status: "FAILED",
            completedAt: new Date(),
            durationMs: duration,
            errorMessage: `Max retries (${maxRetries}) exceeded. Error: ${err.message}`,
          },
        });
        this.broadcastCommandUpdate(commandId, "FAILED");

        await auditEngine.logCommandFailure(
          commandId,
          cmd.type,
          `Max retries exceeded. Terminal failure: ${err.message}`,
          user,
          cmd.origin
        );
      }
    }
  }

  /**
   * Publishes command status updates to the system EventBus
   */
  private broadcastCommandUpdate(commandId: string, status: string) {
    eventBus.publish({
      name: "CommandUpdated",
      source: "execution-engine",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "session",
      payload: { commandId, status },
    });
  }
}

export const executionEngine = ExecutionEngine.getInstance();
export default executionEngine;
