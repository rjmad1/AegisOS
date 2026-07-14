import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";
import { getAuthenticatedUser } from "../route";

export async function GET(
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

    return NextResponse.json({
      id: command.id,
      type: command.type,
      status: command.status,
      priority: command.priority,
      payload: JSON.parse(command.payload),
      riskLevel: command.riskLevel,
      userId: command.userId,
      userEmail: command.userEmail,
      deviceId: command.deviceId,
      origin: command.origin,
      approvalType: command.approvalType,
      approvalStatus: command.approvalStatus,
      approvers: JSON.parse(command.approvers || "[]"),
      scheduledAt: command.scheduledAt,
      createdAt: command.createdAt,
      startedAt: command.startedAt,
      completedAt: command.completedAt,
      durationMs: command.durationMs,
      retryCount: command.retryCount,
      maxRetries: command.maxRetries,
      errorMessage: command.errorMessage,
      result: command.result ? JSON.parse(command.result) : null,
      rollbackResult: command.rollbackResult ? JSON.parse(command.rollbackResult) : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
