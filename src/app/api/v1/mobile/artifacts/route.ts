import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/sdk/platform-sdk";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    
    const result = await artifactRegistry.query({ limit: 100 });
    let items = result.items;
    
    if (projectId) {
      items = items.filter(art => 
        art.tags.includes(`project:${projectId}`) || 
        art.metadata?.projectId === projectId ||
        art.relationships.some(r => r.type === "parent" && r.targetId === projectId)
      );
    }

    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
