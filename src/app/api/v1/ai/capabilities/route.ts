import { NextRequest } from "next/server";
import { aiRuntimeService } from "@/services/ai-runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const matrix = await aiRuntimeService.getCapabilityMatrix();
    return handleCaching(request, matrix);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
