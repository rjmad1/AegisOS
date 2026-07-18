// src/app/api/v1/oil/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { executionRuntimeService } from "@/services/execution-runtime.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: "Message parameter is missing." }, { status: 400 });
    }

    // 1. Create execution
    const execution = await executionRuntimeService.createExecution(
      message,
      { userId: "usr-admin-01", role: "admin" }
    );

    // 2. Validate
    const isValid = await executionRuntimeService.validateExecution(execution.executionId);
    if (isValid) {
      // 3. Execute
      await executionRuntimeService.execute(execution.executionId);
    }

    const finalExec = (await executionRuntimeService.getExecution(execution.executionId))!;
    const assistantReply =
      finalExec.status === "FAILED"
        ? finalExec.error || "Safety check failed"
        : finalExec.metadata.assistantReply || "";

    const nloResponse = finalExec.metadata.nloResponse || {
      response: assistantReply,
      intent: finalExec.intent.intentId,
      structuredActions: [],
      explanation: {
        evidence: "Execution processed through the AegisOS Universal Execution Contract.",
        reasoning: "Routed command request through ExecutionRuntimeService.",
        confidence: 0.95,
      },
    };

    return NextResponse.json({
      success: finalExec.status !== "FAILED",
      ...nloResponse,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
