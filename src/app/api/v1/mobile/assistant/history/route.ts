import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../commands/route";
import { conversationService } from "@/platform/assistant/ConversationService";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const history = await conversationService.getHistory(undefined, user.id);
    return NextResponse.json({ history });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
