import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const agent = await runtimeService.getAgent(id);
    if (!agent) {
      return Response.json({ error: "Agent not found" }, { status: 404 });
    }
    return handleCaching(request, agent);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
