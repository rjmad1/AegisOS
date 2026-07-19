import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/sdk/platform-sdk";
import { ArtifactType } from "@/types/artifact";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const type = searchParams.get("type") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const lifecycleState = searchParams.get("lifecycleState") || undefined;
    const sortField = searchParams.get("sortField") || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined;
    const folder = searchParams.get("folder") !== null ? searchParams.get("folder")! : undefined;

    // Trigger sync and query registry
    const result = await artifactRegistry.query({
      search,
      type,
      tag,
      lifecycleState,
      sortField,
      sortOrder,
      limit,
      offset,
      folder
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, description, content, tags, conversationId, workflowId } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    const fileContentStr = content || "";
    const data = new TextEncoder().encode(fileContentStr);
    const ext = name.split(".").pop() || "";
    
    // Save physically using local artifact storage provider
    const providers = require("@/infrastructure/providers/registry").ProviderRegistry.getInstance().getProvidersByType("artifact-provider");
    if (providers.length === 0) {
      return NextResponse.json({ error: "LocalArtifactStorageProvider not found" }, { status: 500 });
    }
    const provider = providers[0];
    const storageUri = await provider.save(name, data, type);

    // Sync files and register custom metadata
    await artifactRegistry.sync();
    
    // Compute deterministic ID
    const crypto = require("crypto");
    const id = "art-" + crypto.createHash("md5").update(name).digest("hex");

    // Save metadata
    artifactRegistry.registerCustomMetadata(id, {
      tags: tags || [],
      description: description || `Generated artifact file: ${name}`,
      relationships: [
        ...(conversationId ? [{ targetId: conversationId, type: "conversation" }] : []),
        ...(workflowId ? [{ targetId: workflowId, type: "workflow" }] : [])
      ]
    });

    const art = artifactRegistry.getById(id);
    return NextResponse.json(art, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
