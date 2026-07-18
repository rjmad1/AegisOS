import { NextRequest, NextResponse } from "next/server";
import { workspaceService } from "@/services/workspace.service";

export async function GET(req: NextRequest) {
  try {
    const list = await workspaceService.listWorkspaces();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
