import { NextRequest } from "next/server";
import { aiRuntimeService } from "@/services/ai-runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const provider = await aiRuntimeService.getProvider(id);
    if (!provider) {
      return Response.json({ error: "Provider not found" }, { status: 404 });
    }
    return handleCaching(request, provider);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
