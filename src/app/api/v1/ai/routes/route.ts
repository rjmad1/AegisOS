import { NextRequest } from "next/server";
import { aiRuntimeService } from "@/services/ai-runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const routes = await aiRuntimeService.getRoutes();
    return handleCaching(request, { routes });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
