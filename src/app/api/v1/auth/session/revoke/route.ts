import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/infrastructure/db/prisma";

const authSecret = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(authSecret);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, userId } = body;

    // 1. If explicit session ID is passed, delete it
    if (sessionId) {
      await prisma.session.deleteMany({
        where: { id: sessionId }
      });
      return NextResponse.json({ success: true, message: `Session ${sessionId} revoked` });
    }

    // 2. If user ID is passed, revoke all of their sessions
    if (userId) {
      await prisma.session.deleteMany({
        where: { userId }
      });
      return NextResponse.json({ success: true, message: `All sessions for user ${userId} revoked` });
    }

    // 3. Otherwise, revoke the caller's active session
    const token = request.cookies.get("ops_auth_token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
        const sessId = payload.sessionId as string;
        if (sessId) {
          await prisma.session.deleteMany({ where: { id: sessId } });
        }
      } catch {}
    }

    const response = NextResponse.json({ success: true, message: "Caller session revoked" });
    response.cookies.delete("ops_auth_token");
    response.cookies.delete("auth_session");

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
