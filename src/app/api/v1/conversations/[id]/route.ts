import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

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
