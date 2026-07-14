import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../route";
import { approvalEngine } from "@/platform/control/ApprovalEngine";
import { executionEngine } from "@/platform/control/ExecutionEngine";
import { auditEngine } from "@/platform/control/AuditEngine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { signature } = body;

    const result = await approvalEngine.processApproval(
      id,
      user.id,
      user.email,
      user.role,
      "APPROVED",
      signature
    );

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    await auditEngine.logEvent(
      id,
      "approved",
      "configuration",
      `Command approval recorded. User: ${user.email}, Decision: APPROVED`,
      user,
      ipAddress
    );

    if (result.commandStatus === "QUEUED") {
      await executionEngine.enqueueCommand(id);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: "BAD_REQUEST", message: err.message }, { status: 400 });
  }
}
