import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/infrastructure/sdk/platform-sdk";
import { commandBus } from "@/platform/control/CommandBus";

const authSecret = process.env.AUTH_SECRET!;
const key = new TextEncoder().encode(authSecret);

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    
    let userId = (payload.userId as string) || "mobile_operator";
    let email = (payload.email as string) || "operator@aegis-os.local";
    let role = (payload.role as string) || "Operator";

    if (payload.deviceId) {
      const session = await prisma.mobileSession.findFirst({
        where: { deviceId: payload.deviceId as string, status: "ACTIVE" },
      });
      if (session && session.userId) {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (user) {
          userId = user.id;
          email = user.email;
          role = user.role;
        }
      }
    } else if (payload.sessionId) {
      const session = await prisma.session.findUnique({ where: { id: payload.sessionId as string } });
      if (session) {
        role = session.role;
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        if (user) {
          userId = user.id;
          email = user.email;
          role = user.role;
        }
      }
    }

    return { id: userId, email, role };
  } catch (err) {
    return null;
  }
}

/**
 * GET: Lists commands with filters and search
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: any = {};
    if (status) {
      where.status = status.toUpperCase();
    }
    if (type) {
      where.type = { contains: type };
    }
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { type: { contains: search } },
        { payload: { contains: search } },
        { errorMessage: { contains: search } },
      ];
    }

    const commands = await prisma.command.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.command.count({ where });

    return NextResponse.json({
      commands: commands.map((c) => ({
        id: c.id,
        type: c.type,
        status: c.status,
        priority: c.priority,
        payload: JSON.parse(c.payload),
        riskLevel: c.riskLevel,
        userId: c.userId,
        userEmail: c.userEmail,
        deviceId: c.deviceId,
        origin: c.origin,
        approvalType: c.approvalType,
        approvalStatus: c.approvalStatus,
        approvers: JSON.parse(c.approvers || "[]"),
        scheduledAt: c.scheduledAt,
        createdAt: c.createdAt,
        startedAt: c.startedAt,
        completedAt: c.completedAt,
        durationMs: c.durationMs,
        retryCount: c.retryCount,
        maxRetries: c.maxRetries,
        errorMessage: c.errorMessage,
        result: c.result ? JSON.parse(c.result) : null,
        rollbackResult: c.rollbackResult ? JSON.parse(c.rollbackResult) : null,
      })),
      total,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err.message }, { status: 500 });
  }
}

/**
 * POST: Submit command to Command Bus
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED", message: "Invalid session credentials" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, priority, payload, deviceId, signature, replayNonce, timestamp, emergencyOverride } = body;

    if (!type || !payload) {
      return NextResponse.json({ error: "BAD_REQUEST", message: "type and payload fields are required" }, { status: 400 });
    }

    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    const result = await commandBus.dispatch(
      {
        type,
        priority,
        payload,
        origin: deviceId ? "mobile" : "console",
        deviceId,
        signature,
        replayNonce,
        timestamp,
        emergencyOverride,
      },
      user,
      ipAddress
    );

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("[C2:API] Dispatch failed:", err.message);
    return NextResponse.json({ error: "FORBIDDEN", message: err.message }, { status: 403 });
  }
}
