import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/services/workspace.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || undefined;
    const items = await workspaceService.listWorkspaces(tenantId);
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const params = await req.json();
    const workspace = await workspaceService.createWorkspace(params);
    return NextResponse.json(workspace);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
