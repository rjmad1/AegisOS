import { NextRequest, NextResponse } from "next/server";
import { skillOptService } from "@/infrastructure/optimization/skillopt-service";
import { executionRuntimeService } from "@/services/execution-runtime.service";

export async function GET() {
  const drafts = skillOptService.listDrafts();
  return NextResponse.json(drafts);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, draftId, author } = body;

    const uExec = await executionRuntimeService.createExecution(
      `Optimization Action: ${action}`,
      { userId: author || "usr-admin-01", role: "admin" }
    );
    uExec.metadata.body = body;

    const isValid = await executionRuntimeService.validateExecution(uExec.executionId);
    if (!isValid) {
      throw new Error(uExec.error || "Validation failed for Optimization Action.");
    }

    await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Started", "optimization", "optimization-endpoint");

    try {
      if (action === "optimize") {
        if (!name) {
          return NextResponse.json({ error: "Missing required parameter: name" }, { status: 400 });
        }
        const draft = await skillOptService.optimizePrompt(name);
        if (!draft) {
          return NextResponse.json({ error: `Prompt template "${name}" not found` }, { status: 404 });
        }

        uExec.metadata.draft = draft;
        await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Completed", "optimization", "optimization-endpoint");
        await executionRuntimeService.completeExecution(uExec.executionId);

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

        uExec.metadata.success = success;
        await executionRuntimeService.recordTimelineEvent(uExec.executionId, "Completed", "optimization", "optimization-endpoint");
        await executionRuntimeService.completeExecution(uExec.executionId);

        return NextResponse.json({ success: true, message: "Draft promoted to active prompt registry template." });
      }

      return NextResponse.json(
        { error: "Invalid action. Supported: optimize | approve" },
        { status: 400 }
      );
    } catch (err: any) {
      await executionRuntimeService.failExecution(uExec.executionId, err.message);
      throw err;
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
