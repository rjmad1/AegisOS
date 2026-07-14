import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../commands/route";
import { conversationService } from "@/platform/assistant/ConversationService";

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

    const result = await conversationService.postChatMessage(conversationId, content, user);
    
    return NextResponse.json({
      conversationId,
      ...result,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
