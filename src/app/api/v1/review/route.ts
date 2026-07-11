import { NextRequest, NextResponse } from "next/server";
import { llmCouncilService } from "@/infrastructure/review/llm-council-service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const report = llmCouncilService.getReport(id);
      if (!report) {
        return NextResponse.json({ error: `Review report with ID ${id} not found` }, { status: 404 });
      }
      return NextResponse.json(report);
    }

    const list = llmCouncilService.listReports();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, targetName, content, requester } = body;

    if (!type || !targetName || !content) {
      return NextResponse.json(
        { error: "Missing required parameters: type, targetName, content" },
        { status: 400 }
      );
    }

    if (!["architecture", "code", "security", "release"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid review type. Must be: architecture | code | security | release" },
        { status: 400 }
      );
    }

    const reviewId = await llmCouncilService.triggerAsyncReview(
      type,
      targetName,
      content,
      requester || "Developer Console"
    );

    return NextResponse.json({
      reviewId,
      status: "queued",
      message: `Asynchronous multi-model ${type} review for '${targetName}' has been enqueued.`
    }, { status: 202 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
