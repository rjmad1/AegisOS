import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const result = await runtimeService.getWorkflows({ page, limit, search });
    return handleCaching(request, result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
