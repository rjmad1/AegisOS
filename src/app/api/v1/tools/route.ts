import { NextRequest } from "next/server";
import { runtimeService } from "@/services/runtime.service";
import { handleCaching } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    let tools = await runtimeService.getTools();
    
    if (search) {
      const q = search.toLowerCase();
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
    }
    if (category) {
      tools = tools.filter(t => t.category === category);
    }

    return handleCaching(request, { tools });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
