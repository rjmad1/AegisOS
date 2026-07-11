import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/registry/artifact-registry";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

    const result = await artifactRegistry.query({
      search: q,
      limit
    });

    // Map to simple SearchResult interface expected by client search
    const mapped = result.items.map(item => ({
      id: item.id,
      title: item.name,
      type: "artifact",
      description: item.description,
      score: 1.0,
      metadata: {
        type: item.type,
        size: item.size,
        createdDate: item.createdDate,
        tags: item.tags
      }
    }));

    return NextResponse.json(mapped);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
