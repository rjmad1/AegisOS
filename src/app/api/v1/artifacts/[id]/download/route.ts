import { NextRequest } from "next/server";
import { artifactRegistry } from "@/infrastructure/registry/artifact-registry";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const artifact = artifactRegistry.getById(id);

    if (!artifact) {
      return new Response("Artifact not found", { status: 404 });
    }

    let filePath = artifact.storage.uri;
    if (filePath.startsWith("file:///")) {
      filePath = filePath.replace("file:///", "");
    }
    filePath = path.resolve(filePath);

    if (!fs.existsSync(filePath)) {
      return new Response("Physical file not found on disk", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": artifact.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${artifact.name}"`,
        "Content-Length": artifact.size.toString()
      }
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
