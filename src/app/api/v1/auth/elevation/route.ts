import { NextResponse } from "next/server";
import prisma from "@/infrastructure/db/prisma";
import { jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(authSecret);

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("; ").find(c => c.startsWith("ops_auth_token="))?.split("=")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const userRole = payload.role as string;

    // Only administrators can list elevation requests
    if (userRole !== "Administrator" && userRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const records = await prisma.securityState.findMany({
      where: { key: { startsWith: "elevation:" } }
    });

    const requests = records.map(r => {
      const data = JSON.parse(r.value);
      return {
        userId: r.key.replace("elevation:", ""),
        ...data
      };
    });

    return NextResponse.json(requests);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("; ").find(c => c.startsWith("ops_auth_token="))?.split("=")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const username = payload.username as string || "user";
    const email = payload.email as string || "user@ai-ops.local";
    const userId = (payload.userId as string) || `user-${username}`;

    const body = await request.json().catch(() => ({}));
    const { action, requestedRole, reason, durationMinutes, requestId } = body;

    // 1. Submit a request
    if (action === "request") {
      if (!requestedRole || !reason) {
        return NextResponse.json({ error: "Missing requestedRole or reason" }, { status: 400 });
      }

      const requestPayload = {
        requestId: crypto.randomUUID(),
        username,
        email,
        requestedRole,
        reason,
        durationMinutes: durationMinutes || 60,
        status: "pending",
        requestedAt: new Date().toISOString(),
        expiresAt: null,
      };

      await prisma.securityState.upsert({
        where: { key: `elevation:${userId}` },
        update: { value: JSON.stringify(requestPayload) },
        create: { key: `elevation:${userId}`, value: JSON.stringify(requestPayload) }
      });

      return NextResponse.json({ success: true, message: "Elevation request submitted", request: requestPayload });
    }

    // 2. Approve/Reject a request (requires Administrator role)
    if (action === "approve" || action === "reject") {
      const callerRole = payload.role as string;
      if (callerRole !== "Administrator" && callerRole !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!requestId) {
        return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
      }

      const targetUserId = body.userId;
      if (!targetUserId) {
        return NextResponse.json({ error: "Missing userId of the target request" }, { status: 400 });
      }

      const record = await prisma.securityState.findUnique({
        where: { key: `elevation:${targetUserId}` }
      });

      if (!record) {
        return NextResponse.json({ error: "Elevation request not found" }, { status: 404 });
      }

      const requestData = JSON.parse(record.value);
      if (requestData.requestId !== requestId) {
        return NextResponse.json({ error: "Request ID mismatch" }, { status: 400 });
      }

      if (action === "approve") {
        requestData.status = "approved";
        requestData.approvedAt = new Date().toISOString();
        requestData.expiresAt = new Date(Date.now() + requestData.durationMinutes * 60000).toISOString();

        // Update the user's role in the DB temporarily
        const dbUser = await prisma.user.findFirst({
          where: { id: targetUserId, deletedAt: null }
        });
        if (dbUser) {
          // Store previous role so we can demote later
          requestData.previousRole = dbUser.role;
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: requestData.requestedRole }
          });
        }
      } else {
        requestData.status = "rejected";
        requestData.rejectedAt = new Date().toISOString();
      }

      await prisma.securityState.update({
        where: { key: `elevation:${targetUserId}` },
        data: { value: JSON.stringify(requestData) }
      });

      return NextResponse.json({ success: true, message: `Request ${action}d successfully`, request: requestData });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
