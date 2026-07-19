import { NextRequest, NextResponse } from "next/server";
import { artifactRegistry } from "@/infrastructure/sdk/platform-sdk";
import { previewEngine } from "@/infrastructure/sdk/platform-sdk";
import * as path from "path";

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

    // Resolve path of file from storage URI
    let filePath = artifact.storage.uri;
    if (filePath.startsWith("file:///")) {
      filePath = filePath.replace("file:///", "");
    }
    filePath = path.resolve(filePath);

    const preview = await previewEngine.generatePreview(filePath, artifact.type);
    return NextResponse.json(preview);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
