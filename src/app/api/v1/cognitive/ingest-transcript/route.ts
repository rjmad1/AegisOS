import { NextResponse } from "next/server";
import { CommandRegistry } from "@/platform/commands/CommandRegistry";
import { IngestMeetingPayload } from "@/platform/commands/IngestMeetingCommand";

export async function POST(request: Request) {
  try {
    // Basic API Key validation
    const authHeader = request.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${process.env.CONVERSA_API_KEY || "dev-trusted-key"}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();

    if (!payload.meetingId || !payload.transcriptText) {
      return NextResponse.json({ error: "Missing meetingId or transcriptText" }, { status: 400 });
    }

    // Prepare context for the command execution
    const context = {
      userId: payload.userId || "system",
      tenantId: payload.tenantId || "default-tenant",
    };

    // Execute the Cognitive Ingestion command
    const result = await CommandRegistry.executeCommand("cmd:cognitive:ingest-meeting", payload as IngestMeetingPayload, context);

    if (result.outcome === "FAILURE") {
      return NextResponse.json({ error: result.error, correlationId: result.correlationId }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      correlationId: result.correlationId,
      data: result.data,
      executionDurationMs: result.executionDurationMs
    });

  } catch (error: any) {
    console.error("[CognitiveAPI] Error processing transcript:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
