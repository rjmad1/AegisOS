// src/infrastructure/events/execution-event-publisher.ts
// Decoupled Event Publisher for Universal Execution Runtime events using HardenedEventBus

import { eventBus } from "./event-bus";
import { UniversalExecution, UniversalExecutionStep } from "../../services/execution-runtime.service";

export class ExecutionEventPublisher {
  private static instance: ExecutionEventPublisher | null = null;

  public static getInstance(): ExecutionEventPublisher {
    if (!ExecutionEventPublisher.instance) {
      ExecutionEventPublisher.instance = new ExecutionEventPublisher();
    }
    return ExecutionEventPublisher.instance;
  }

  public async publishCreated(execution: UniversalExecution): Promise<void> {
    await eventBus.publish({
      name: "ExecutionCreated",
      source: "execution-runtime",
      version: "v1",
      priority: "high",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, execution },
    });
  }

  public async publishPlanned(execution: UniversalExecution): Promise<void> {
    await eventBus.publish({
      name: "ExecutionPlanned",
      source: "execution-runtime",
      version: "v1",
      priority: "high",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, plan: execution.executionPlan },
    });
  }

  public async publishStarted(execution: UniversalExecution): Promise<void> {
    await eventBus.publish({
      name: "ExecutionStarted",
      source: "execution-runtime",
      version: "v1",
      priority: "high",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, execution },
    });
  }

  public async publishProgress(execution: UniversalExecution, step: UniversalExecutionStep): Promise<void> {
    await eventBus.publish({
      name: "ExecutionProgress",
      source: "execution-runtime",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, step },
    });
  }

  public async publishWaiting(execution: UniversalExecution, reason: string): Promise<void> {
    await eventBus.publish({
      name: "ExecutionWaiting",
      source: "execution-runtime",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, reason },
    });
  }

  public async publishCompleted(execution: UniversalExecution): Promise<void> {
    await eventBus.publish({
      name: "ExecutionCompleted",
      source: "execution-runtime",
      version: "v1",
      priority: "high",
      securityClassification: "internal",
      retentionPolicy: "archive",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, execution },
    });
  }

  public async publishFailed(execution: UniversalExecution, error: string): Promise<void> {
    await eventBus.publish({
      name: "ExecutionFailed",
      source: "execution-runtime",
      version: "v1",
      priority: "critical",
      securityClassification: "internal",
      retentionPolicy: "archive",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, error },
    });
  }

  public async publishCancelled(execution: UniversalExecution, reason: string): Promise<void> {
    await eventBus.publish({
      name: "ExecutionCancelled",
      source: "execution-runtime",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "session",
      correlationId: execution.correlationId,
      traceId: execution.telemetry.traceId,
      payload: { executionId: execution.executionId, reason },
    });
  }
}

export const executionEventPublisher = ExecutionEventPublisher.getInstance();
export default executionEventPublisher;
