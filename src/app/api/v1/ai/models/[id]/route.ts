import { NextRequest } from "next/server";
import { aiRuntimeService } from "@/services/ai-runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const model = await aiRuntimeService.getModel(decodeURIComponent(id));
    if (!model) {
      return Response.json({ error: "Model not found" }, { status: 404 });
    }
    return handleCaching(request, model);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
