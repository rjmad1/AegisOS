import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/sdk/platform-sdk";
import { ProviderRegistry } from "@/infrastructure/sdk/platform-sdk";
import { LocalArtifactStorageProvider } from "@/infrastructure/sdk/platform-sdk";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artifact = artifactRegistry.getById(id);

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    return NextResponse.json(artifact);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tags, description, favorites, relationships } = body;

    const success = artifactRegistry.registerCustomMetadata(id, {
      tags,
      description,
      favorites,
      relationships
    });

    if (!success) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    const artifact = artifactRegistry.getById(id);
    return NextResponse.json(artifact);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artifact = artifactRegistry.getById(id);

    if (!artifact) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }

    // Delete physically using provider
    const providers = ProviderRegistry.getInstance().getProvidersByType<LocalArtifactStorageProvider>("artifact-provider");
    if (providers.length > 0) {
      await providers[0].delete(artifact.storage.uri);
    }

    // Resync registry to remove from database cache
    await artifactRegistry.sync();

    return NextResponse.json({ success: true, message: "Artifact deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
