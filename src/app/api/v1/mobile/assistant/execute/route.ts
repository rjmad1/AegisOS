import { NextRequest, NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";
import { getAuthenticatedUser } from "../../commands/route";
import { commandBus } from "@/platform/control/CommandBus";
import { ExecutionPlan } from "@/platform/assistant/types";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { messageId, deviceId, signature, replayNonce, timestamp } = body;

    if (!messageId) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "messageId field is required" }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || !message.executionPlan) {
      return NextResponse.json({ error: "NOT_FOUND", message: "Message or execution plan not found." }, { status: 404 });
    }

    const plan: ExecutionPlan = JSON.parse(message.executionPlan);
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const commandIds: string[] = [];

    // Dispatch all plan steps to the C2 Command Bus
    for (const step of plan.steps) {
      const dispatchRes = await commandBus.dispatch(
        {
          type: step.commandType,
          priority: "MEDIUM",
          payload: step.payload,
          origin: "mobile",
          deviceId,
          signature,
          replayNonce,
          timestamp,
        },
        user,
        ipAddress
      );
      commandIds.push(dispatchRes.commandId);
    }

    // Save commands references to the Message record
    await prisma.message.update({
      where: { id: messageId },
      data: {
        commands: JSON.stringify(commandIds),
      },
    });

    return NextResponse.json({
      success: true,
      commandIds,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}
