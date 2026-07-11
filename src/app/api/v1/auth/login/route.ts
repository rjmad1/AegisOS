import { NextResponse } from "next/server";
import crypto from "crypto";
import { loginLockoutMap } from "@/proxy";

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
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.OPS_ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.OPS_ADMIN_PASSWORD || "AdminPassword123!";
    const secret = process.env.OPS_JWT_SECRET || "super-secret-random-hash-key-for-console-jwt-signing-2026";
    const sessionMinutes = parseInt(process.env.OPS_SESSION_TIMEOUT_MINUTES || "480", 10);

    // 1. Verify brute-force lockout status first
    const now = Date.now();
    const lockout = loginLockoutMap.get(ip);
    if (lockout && now < lockout.lockUntil) {
      const waitSeconds = Math.ceil((lockout.lockUntil - now) / 1000);
      return NextResponse.json(
        { code: "LOCKED_OUT", message: `Too many login failures. Please wait ${waitSeconds} seconds.` },
        { status: 429 }
      );
    }

    if (username === expectedUsername && password === expectedPassword) {
      // Clear lockout count on success
      loginLockoutMap.delete(ip);

      const mockUser = {
        id: "usr-admin-01",
        username: expectedUsername,
        email: "admin@ai-ops.local",
        role: "admin",
      };

      const expires = Date.now() + sessionMinutes * 60 * 1000;
      const token = signToken({ username, role: "admin", expires }, secret);

      const response = NextResponse.json({
        user: mockUser,
        token,
      });

      // Set Secure, HttpOnly cookie with Strict SameSite enforcement
      response.cookies.set({
        name: "ops_auth_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: sessionMinutes * 60,
      });

      return response;
    }

    // 2. Increment failed login attempts count for IP
    const currentLockout = lockout || { attempts: 0, lockUntil: 0 };
    currentLockout.attempts++;
    if (currentLockout.attempts >= 5) {
      currentLockout.lockUntil = now + 15 * 60 * 1000; // 15 minutes lockout
      console.warn(`[Proxy Security] IP ${ip} has been locked out due to brute force attempts.`);
    }
    loginLockoutMap.set(ip, currentLockout);

    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { code: "BAD_REQUEST", message: "Invalid request payload" },
      { status: 400 }
    );
  }
}
