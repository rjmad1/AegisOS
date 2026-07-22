"use server";

import { DEP } from "./DurableExecutionPlatform";
import { policyEngine } from "../control/PolicyEngine";
import type { CommandContext, ExecutionResult } from "../commands/types";
import { TransactionCoordinator } from "./TransactionCoordinator";
import { telemetryTracker } from "@/infrastructure/observability/telemetry";

export async function dispatchToServer(commandId: string, payload: any, context: CommandContext): Promise<ExecutionResult> {
  // 1. Telemetry and Audit setup
  const traceCtx = telemetryTracker.createTrace();
  const spanId = telemetryTracker.startSpan(traceCtx.traceId, "ActionDispatcher.dispatch", undefined, {
    commandId,
    userId: context.userId
  });

  console.log(`[ActionDispatcher Server] Starting dispatch for ${commandId} (Trace: ${traceCtx.traceId})`);

  // 2. Policy Enforcement: Fail closed
  if (!context.userId || !(context as any).userRole) {
    console.error(`[Policy Enforcement] Rejected execution ${commandId}: Missing authenticated identity or role.`);
    telemetryTracker.endSpan(traceCtx.traceId, spanId, { status: "rejected", reason: "No authenticated identity" });
    return {
      outcome: 'FAILURE',
      data: { 
        error: "Authentication or Authorization error",
        reason: "No authenticated identity or role provided.",
        traceId: traceCtx.traceId
      },
      correlationId: `err_${Date.now()}`,
      executionDurationMs: 0
    };
  }

  // Determine risk level based on the commandId (cast to any to bypass strict type for now)
  const riskLevel = policyEngine.determineRiskLevel(commandId as any);
  
  // Validate Policy
  const policyResult = policyEngine.validatePolicy({ type: commandId as any, origin: 'console', payload, emergencyOverride: false }, (context as any).userRole, riskLevel);
  
  if (!policyResult.authorized) {
    console.error(`[Policy Enforcement] Rejected execution ${commandId} for user ${context.userId} (${(context as any).userRole}): ${policyResult.reason}`);
    telemetryTracker.endSpan(traceCtx.traceId, spanId, { status: "rejected", reason: policyResult.reason });
    return {
      outcome: 'FAILURE',
      data: { 
        error: "Authorization error",
        reason: policyResult.reason,
        traceId: traceCtx.traceId
      },
      correlationId: `err_${Date.now()}`,
      executionDurationMs: 0
    };
  }

  // 3. Submits to the Durable Execution Platform.
  const execution = await DEP.submit(commandId, payload, context, traceCtx.traceId);
  
  // 4. Fire-and-forget Transaction Coordinator triggering (simulate background worker)
  if (execution.state === 'Executing') {
    TransactionCoordinator.process(execution.id, traceCtx.traceId).catch(e => console.error("Coordinator failure", e));
  }
  
  telemetryTracker.endSpan(traceCtx.traceId, spanId, { status: "submitted", executionId: execution.id });
  return {
    outcome: execution.state === 'Failed' ? 'FAILURE' : 'PENDING',
    data: { executionId: execution.id, state: execution.state, traceId: traceCtx.traceId },
    correlationId: execution.transactionId,
    executionDurationMs: 0
  };
}
