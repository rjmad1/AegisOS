import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/app/api/v1/mobile/commands/route";
import { prisma } from "@/infrastructure/sdk/platform-sdk";
import { conversationService } from "@/platform/assistant/ConversationService";
import { executionRuntimeService } from "@/services/execution-runtime.service";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "UNAUTHORIZED", message: "Invalid session credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", message: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let { conversationId, content } = body;
  if (!content) {
    return new Response(
      JSON.stringify({ error: "BAD_REQUEST", message: "content field is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const startTime = Date.now();

  // Auto-create conversation if not specified
  if (!conversationId) {
    const conv = await conversationService.createConversation("Operations Thread", undefined, user.id);
    conversationId = conv.id;
  } else {
    // Verify conversation exists
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return new Response(
        JSON.stringify({ error: "NOT_FOUND", message: `Conversation ${conversationId} not found.` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // Save user message to database
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content,
    },
  });

  const encoder = new TextEncoder();
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 1. Create execution
        const execution = await executionRuntimeService.createExecution(
          content,
          { userId: user.id, role: user.role },
          { conversationId }
        );

        // 2. Validate execution
        const isValid = await executionRuntimeService.validateExecution(execution.executionId);
        if (!isValid) {
          const failedExec = await executionRuntimeService.getExecution(execution.executionId);
          const errorMsg = failedExec?.error || "Safety check failed";

          // Stream error reply
          const tokens = errorMsg.split(/(\s+)/).filter(Boolean);
          for (const token of tokens) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            await sleep(25);
          }

          const totalLatency = Date.now() - startTime;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                conversationId,
                message: {
                  id: "msg-" + crypto.randomUUID().slice(0, 8),
                  conversationId,
                  role: "assistant",
                  content: errorMsg,
                  createdAt: new Date().toISOString(),
                },
                plan: null,
                metrics: {
                  planningLatencyMs: totalLatency,
                  llmLatencyMs: 0,
                  planSuccess: false,
                },
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // 3. Execute
        await executionRuntimeService.execute(execution.executionId);
        const finalExec = await executionRuntimeService.getExecution(execution.executionId);
        const assistantReply = finalExec?.metadata.assistantReply || "No reply generated.";
        const finalPlan = finalExec?.executionPlan || null;

        // 4. Save assistant reply to database
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: assistantReply,
            intent: finalExec?.intent.intentId || null,
            entities: JSON.stringify(finalExec?.executionPlan?.entities || {}),
            executionPlan: finalPlan ? JSON.stringify(finalPlan) : null,
          },
        });

        // Update conversation updatedAt timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // 5. Stream tokens
        const tokens = assistantReply.split(/(\s+)/).filter(Boolean);
        for (const token of tokens) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
          await sleep(25);
        }

        const totalLatency = Date.now() - startTime;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              conversationId,
              message: assistantMsg,
              plan: finalPlan,
              metrics: {
                planningLatencyMs: totalLatency,
                llmLatencyMs: Math.round(totalLatency * 0.4),
                planSuccess: finalPlan !== null,
              },
            })}\n\n`
          )
        );
        controller.close();
      } catch (err: any) {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "INTERNAL_ERROR", message: err.message })}\n\n`)
          );
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}
