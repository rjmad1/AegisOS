import { NextRequest, NextResponse } from "next/server";
import { skillOptService } from "@/infrastructure/optimization/skillopt-service";

export async function GET() {
  const drafts = skillOptService.listDrafts();
  return NextResponse.json(drafts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, draftId, author } = body;

    if (action === "optimize") {
      if (!name) {
        return NextResponse.json({ error: "Missing required parameter: name" }, { status: 400 });
      }
      const draft = await skillOptService.optimizePrompt(name);
      if (!draft) {
        return NextResponse.json({ error: `Prompt template "${name}" not found` }, { status: 404 });
      }
      return NextResponse.json(draft, { status: 201 });
    }

    if (action === "approve") {
      if (!draftId || !author) {
        return NextResponse.json({ error: "Missing required parameters: draftId, author" }, { status: 400 });
      }
      const success = skillOptService.approveDraft(draftId, author);
      if (!success) {
        return NextResponse.json({ error: `Optimization draft ID ${draftId} not found` }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Draft promoted to active prompt registry template." });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported: optimize | approve" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
