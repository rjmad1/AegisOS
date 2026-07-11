import { NextRequest, NextResponse } from "next/server";
import { ProviderRegistry } from "@/infrastructure/providers/registry";
import { IFileProviderAdapter } from "@/infrastructure/contracts/file";
import * as fs from "fs";
import * as path from "path";

// Helper to retrieve active file provider
function getFileProvider(): IFileProviderAdapter {
  const providers = ProviderRegistry.getInstance().getProvidersByType<IFileProviderAdapter>("file-provider");
  if (providers.length === 0) {
    throw new Error("No active file-provider adapter registered in ProviderRegistry");
  }
  return providers[0];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");
    const download = searchParams.get("download") === "true";

    if (!targetPath) {
      return NextResponse.json({ error: "Missing required parameter: path" }, { status: 400 });
    }

    const provider = getFileProvider();
    const resolvedPath = path.resolve(targetPath).replace(/\\/g, "/");

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: `Path does not exist: ${targetPath}` }, { status: 404 });
    }

    const stats = await provider.getFileStats(resolvedPath);

    if (stats.isDirectory) {
      const children = await provider.listDirectory(resolvedPath);
      return NextResponse.json({
        path: resolvedPath,
        isDirectory: true,
        children: children.map((c: any) => ({
          name: c.name,
          isDirectory: c.isDirectory,
          size: c.size,
          mtime: c.mtime,
          birthtime: c.birthtime
        }))
      });
    } else {
      if (download) {
        const fileBuffer = fs.readFileSync(resolvedPath);
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Disposition": `attachment; filename="${path.basename(resolvedPath)}"`,
            "Content-Type": "application/octet-stream"
          }
        });
      }

      return NextResponse.json({
        path: resolvedPath,
        isDirectory: false,
        size: stats.size,
        mtime: stats.mtime,
        birthtime: stats.birthtime
      });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: targetPath, isDirectory, content, overwrite } = body;

    if (!targetPath) {
      return NextResponse.json({ error: "Missing required parameter: path" }, { status: 400 });
    }

    const provider = getFileProvider();
    const resolvedPath = path.resolve(targetPath).replace(/\\/g, "/");

    if (fs.existsSync(resolvedPath) && !overwrite) {
      return NextResponse.json({ error: `Path already exists: ${targetPath}` }, { status: 409 });
    }

    if (isDirectory) {
      if (!fs.existsSync(resolvedPath)) {
        fs.mkdirSync(resolvedPath, { recursive: true });
      }
      return NextResponse.json({
        path: resolvedPath,
        size: 0,
        writtenAt: new Date().toISOString()
      }, { status: 201 });
    } else {
      await provider.createFile(resolvedPath, content || "");
      const stats = await provider.getFileStats(resolvedPath);
      return NextResponse.json({
        path: resolvedPath,
        size: stats.size,
        writtenAt: new Date().toISOString()
      }, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");

    if (!targetPath) {
      return NextResponse.json({ error: "Missing required parameter: path" }, { status: 400 });
    }

    const provider = getFileProvider();
    const resolvedPath = path.resolve(targetPath).replace(/\\/g, "/");

    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: `Path does not exist: ${targetPath}` }, { status: 404 });
    }

    await provider.deleteFile(resolvedPath);
    return NextResponse.json({
      path: resolvedPath,
      success: true
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
