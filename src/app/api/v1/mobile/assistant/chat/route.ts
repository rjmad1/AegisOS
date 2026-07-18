import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../commands/route";
import { conversationService } from "@/platform/assistant/ConversationService";
import { executionRuntimeService } from "@/services/execution-runtime.service";
import prisma from "@/infrastructure/db/prisma";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const body = await request.json();
    let { conversationId, content } = body;

    if (!content) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "content field is required" }, { status: 400 });
    }

    // Auto-create conversation if not specified
    if (!conversationId) {
      const conv = await conversationService.createConversation("Operations Thread", undefined, user.id);
      conversationId = conv.id;
    }

    // Save user message to database
    await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content,
      },
    });

    // 1. Create execution
    const execution = await executionRuntimeService.createExecution(
      content,
      { userId: user.id, role: user.role },
      { conversationId }
    );

    // 2. Validate
    const isValid = await executionRuntimeService.validateExecution(execution.executionId);
    if (isValid) {
      // 3. Execute
      await executionRuntimeService.execute(execution.executionId);
    }

    const finalExec = (await executionRuntimeService.getExecution(execution.executionId))!;
    const assistantReply = finalExec.status === "FAILED" ? finalExec.error || "Safety check failed" : finalExec.metadata.assistantReply || "";
    const finalPlan = finalExec.status === "FAILED" ? null : finalExec.executionPlan;

    // Save assistant reply to database
    const assistantMsg = await prisma.message.create({
      data: {
        conversationId,
        role: "assistant",
        content: assistantReply,
        intent: finalExec.intent.intentId || null,
        entities: JSON.stringify(finalExec.executionPlan?.entities || {}),
        executionPlan: finalPlan ? JSON.stringify(finalPlan) : null,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId,
      message: assistantMsg,
      plan: finalPlan,
      metrics: {
        planningLatencyMs: finalExec.durationMs || 100,
        llmLatencyMs: Math.round((finalExec.durationMs || 100) * 0.4),
        planSuccess: finalPlan !== null,
      }
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
