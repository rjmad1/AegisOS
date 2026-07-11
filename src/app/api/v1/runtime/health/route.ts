import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const runtime = await runtimeService.getRuntime();
    return handleCaching(request, runtime.health);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
