import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";
import { getAuthenticatedUser } from "../route";
import { auditEngine } from "@/platform/control/AuditEngine";
import { eventBus } from "@/infrastructure/events/event-bus";

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
    const command = await prisma.command.findUnique({
      where: { id },
    });

    if (!command) {
      return NextResponse.json({ error: "NOT_FOUND", message: `Command ${id} not found.` }, { status: 404 });
    }

    if (command.status !== "QUEUED" && command.status !== "PENDING_APPROVAL") {
      return NextResponse.json(
        { error: "INVALID_STATE", message: `Cannot cancel a command in status: ${command.status}` },
        { status: 400 }
      );
    }

    await prisma.command.update({
      where: { id },
      data: {
        status: "CANCELLED",
        approvalStatus: command.approvalStatus === "PENDING" ? "REJECTED" : command.approvalStatus,
      },
    });

    // Broadcast change
    eventBus.publish({
      name: "CommandUpdated",
      source: "execution-engine",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "session",
      payload: { commandId: id, status: "CANCELLED" },
    });

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    await auditEngine.logEvent(
      id,
      "cancelled",
      "runtime",
      `Command was cancelled manually by user.`,
      user,
      ipAddress
    );

    return NextResponse.json({ status: "CANCELLED" });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
