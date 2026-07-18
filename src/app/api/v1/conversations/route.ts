import { NextRequest, NextResponse } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";
import { eventBus } from "@/infrastructure/events/event-bus";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const result = await runtimeService.getConversations({ page, limit, search, status });
    return handleCaching(request, result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, initialMessage, metadata } = body;

    const id = `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const conversation = {
      id,
      title: title || "New AI Conversation",
      startedAt: now,
      updatedAt: now,
      status: "active",
      messageCount: initialMessage ? 1 : 0,
      summary: initialMessage ? initialMessage.slice(0, 50) + "..." : "New AI Workspace persistent thread",
      agentId: "main",
      metadata: metadata || { type: "ai-workspace" },
      messages: initialMessage ? [
        {
          id: `msg-${Date.now()}-user`,
          conversationId: id,
          sender: { id: "user", name: "Operator", role: "user" },
          content: initialMessage,
          timestamp: now
        }
      ] : []
    };

    eventBus.publish({
      id: `evt-${Date.now()}`,
      name: "ConversationStarted",
      source: "conversations-api",
      version: "v1",
      priority: "low",
      securityClassification: "internal",
      retentionPolicy: "session",
      timestamp: now,
      payload: conversation
    });

    return NextResponse.json(conversation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
