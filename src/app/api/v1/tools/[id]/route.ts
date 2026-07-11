import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const name = decodeURIComponent(id);
    const tool = await runtimeService.getTool(name);
    if (!tool) {
      return Response.json({ error: "Tool not found" }, { status: 404 });
    }
    return handleCaching(request, tool);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
