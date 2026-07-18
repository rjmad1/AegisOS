// src/app/api/v1/mobile/extensions/route.ts
// Mobile API route for capability discovery and configuration.

import { NextRequest, NextResponse } from "next/server";
import { extensionRuntimeService } from "@/platform/extension/ExtensionRuntimeService";
import { formatErrorResponse } from "@/utils/api-helper";

export async function GET(request: NextRequest) {
  try {
    const extensions = extensionRuntimeService.getExtensions();
    const activeMobileExtensions = extensions
      .filter(ext => ext.status === "activated")
      .map(ext => ({
        id: ext.id,
        name: ext.manifest.name,
        description: ext.manifest.description,
        version: ext.manifest.version,
        capabilities: ext.manifest.capabilities,
        mobileContributions: ext.manifest.mobileContributions || []
      }));

    return NextResponse.json({
      success: true,
      extensions: activeMobileExtensions
    });
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Extension ID and action are required" }, { status: 400 });
    }

    const extension = extensionRuntimeService.getExtension(id);
    if (!extension) {
      return NextResponse.json({ error: `Extension ${id} not found` }, { status: 404 });
    }

    if (action === "toggle") {
      if (extension.status === "activated") {
        await extensionRuntimeService.deactivate(id);
        return NextResponse.json({ success: true, status: "deactivated", message: `Extension ${id} disabled` });
      } else {
        await extensionRuntimeService.activate(id);
        return NextResponse.json({ success: true, status: "activated", message: `Extension ${id} enabled` });
      }
    }

    return NextResponse.json({ error: `Unsupported mobile action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return formatErrorResponse(err);
  }
}
