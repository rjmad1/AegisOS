import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const execution = await runtimeService.getExecution(id);
    if (!execution) {
      return Response.json({ error: "Execution not found" }, { status: 404 });
    }
    return handleCaching(request, execution);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
