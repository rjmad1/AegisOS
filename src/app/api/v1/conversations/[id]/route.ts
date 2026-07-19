import { NextRequest, NextResponse } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";
import { eventBus } from "@/infrastructure/sdk/platform-sdk";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const conversation = await runtimeService.getConversation(id);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
    return handleCaching(request, conversation);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await request.json();
    const { action, title } = body;

    const validActions = ["pause", "resume", "archive", "complete"];
    if (action && !validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      pause: "paused",
      resume: "active",
      archive: "archived",
      complete: "completed",
    };

    const updatedStatus = action ? statusMap[action] : undefined;

    eventBus.publish({
      id: `evt-${Date.now()}`,
      name: "ConversationUpdated",
      source: "conversations-api",
      version: "v1",
      priority: "low",
      securityClassification: "internal",
      retentionPolicy: "session",
      timestamp: new Date().toISOString(),
      payload: { conversationId: id, status: updatedStatus, title },
    });

    return NextResponse.json({
      id,
      status: updatedStatus || "active",
      title: title || undefined,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    eventBus.publish({
      id: `evt-${Date.now()}`,
      name: "ConversationCompleted",
      source: "conversations-api",
      version: "v1",
      priority: "low",
      securityClassification: "internal",
      retentionPolicy: "session",
      timestamp: new Date().toISOString(),
      payload: { conversationId: id, action: "deleted" },
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
