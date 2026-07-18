// src/app/api/v1/extensions/route.ts
// API route for querying and executing extension lifecycle actions in AegisOS.

import { NextRequest, NextResponse } from "next/server";
import { extensionRuntimeService } from "@/platform/extension/ExtensionRuntimeService";
import { handleCaching, formatErrorResponse } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const extensions = extensionRuntimeService.getExtensions();
    const dependencyGraph = extensionRuntimeService.getDependencyGraph();
    return handleCaching(request, { extensions, dependencyGraph });
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, manifest, files } = body;

    if (!action || !id) {
      return NextResponse.json({ error: "Action and extension ID are required." }, { status: 400 });
    }

    switch (action) {
      case "install": {
        if (!manifest) {
          return NextResponse.json({ error: "Manifest is required for installation." }, { status: 400 });
        }
        const state = await extensionRuntimeService.install(id, manifest, files);
        return NextResponse.json({ success: true, message: `Installed extension ${id}`, state });
      }

      case "activate": {
        await extensionRuntimeService.activate(id);
        const state = extensionRuntimeService.getExtension(id);
        return NextResponse.json({ success: true, message: `Activated extension ${id}`, state });
      }

      case "deactivate": {
        await extensionRuntimeService.deactivate(id);
        const state = extensionRuntimeService.getExtension(id);
        return NextResponse.json({ success: true, message: `Deactivated extension ${id}`, state });
      }

      case "uninstall": {
        await extensionRuntimeService.uninstall(id);
        return NextResponse.json({ success: true, message: `Uninstalled extension ${id}` });
      }

      case "update": {
        if (!manifest) {
          return NextResponse.json({ error: "Manifest is required for updating." }, { status: 400 });
        }
        const state = await extensionRuntimeService.update(id, manifest, files);
        return NextResponse.json({ success: true, message: `Updated extension ${id}`, state });
      }

      default:
        return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
