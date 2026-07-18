import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const activities = [
      {
        id: "act-01",
        workspaceId: "ws-default",
        category: "workspace",
        title: "Workspace Initialized",
        description: "AegisOS Platform Core workspace loaded with 6 persona views.",
        actor: "System",
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        status: "info",
      },
      {
        id: "act-02",
        workspaceId: "ws-default",
        category: "knowledge",
        title: "Knowledge Index Updated",
        description: "Ingested ARCHITECTURE.md (24 chunks, 120 embeddings)",
        actor: "Knowledge Engine",
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        status: "success",
      },
      {
        id: "act-03",
        workspaceId: "ws-default",
        category: "mission",
        title: "Mission Completed",
        description: "Certify Studio Shell Zero Trust (100% verification passed)",
        actor: "Security Engine",
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        status: "success",
      },
      {
        id: "act-04",
        workspaceId: "ws-default",
        category: "artifacts",
        title: "Artifact Generated",
        description: "Generated Sprint 1 Baseline Report (Markdown)",
        actor: "Artifact Registry",
        timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
        status: "info",
      },
      {
        id: "act-05",
        workspaceId: "ws-default",
        category: "approvals",
        title: "HITL Policy Auto-Approved",
        description: "Zero-privilege REST interface compliance certified",
        actor: "Compliance Engine",
        timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        status: "success",
      },
    ];

    const filtered = category
      ? activities.filter((a) => a.category === category)
      : activities;

    return NextResponse.json({ activities: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
