import { NextResponse } from "next/server";
import crypto from "crypto";
import { jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(authSecret);

function signToken(payload: any, secret: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${data}`)
    .digest("base64url");
  return `${header}.${data}.${signature}`;
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1] || 
                  request.headers.get("cookie")?.split("; ").find(c => c.startsWith("ops_auth_token="))?.split("=")[1];

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (!authSecret) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Verify current token
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const username = payload.username as string;
    const role = payload.role as string;

    // Generate rotated token
    const sessionMinutes = parseInt(process.env.OPS_SESSION_TIMEOUT_MINUTES || "480", 10);
    const expires = Date.now() + sessionMinutes * 60 * 1000;
    const rotatedToken = signToken({ username, role, expires, rotated: true }, authSecret);

    const response = NextResponse.json({
      success: true,
      token: rotatedToken,
      expires,
    });

    response.cookies.set({
      name: "ops_auth_token",
      value: rotatedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: sessionMinutes * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid token or expired session", details: err.message }, { status: 401 });
  }
}
