import { NextRequest } from "next/server";
import { aiRuntimeService } from "@/services/ai-runtime.service";
import { handleCaching } from "@/utils/api-helper";
import type { AIModelFilters, CapabilityName, ModelStatus } from "@/types/ai-runtime";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filters: AIModelFilters = {
      provider: searchParams.get("provider") || undefined,
      capability: (searchParams.get("capability") as CapabilityName) || undefined,
      family: searchParams.get("family") || undefined,
      status: (searchParams.get("status") as ModelStatus) || undefined,
      search: searchParams.get("q") || searchParams.get("search") || undefined,
      sortBy: (searchParams.get("sortBy") as any) || undefined,
      sortOrder: (searchParams.get("sortOrder") as any) || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : undefined,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!, 10) : undefined,
    };

    const result = await aiRuntimeService.getModels(filters);
    return handleCaching(request, result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
