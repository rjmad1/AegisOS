// src/app/api/v1/auth/login/route.ts
// Secure login route utilizing persistent DB Lockout management and strict credential verification

import { NextResponse } from "next/server";
import crypto from "crypto";
import LockoutManager from "@/infrastructure/security/lockout-manager";

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

    const expectedUsername = process.env.OPS_ADMIN_USERNAME;
    const expectedPassword = process.env.OPS_ADMIN_PASSWORD;
    const jwtSecret = process.env.AUTH_SECRET || process.env.OPS_JWT_SECRET;

    // Fail startup/runtime if admin configurations are default or insecure
    if (!expectedUsername || expectedUsername === "admin") {
      throw new Error("FATAL: OPS_ADMIN_USERNAME is missing or insecure! Customize credentials in .env.");
    }
    if (!expectedPassword || expectedPassword === "AdminPassword123!") {
      throw new Error("FATAL: OPS_ADMIN_PASSWORD is missing or insecure! Customize credentials in .env.");
    }
    if (!jwtSecret || jwtSecret === "super-secret-random-hash-key-for-console-jwt-signing-2026" || jwtSecret === "fallback_secret_must_change_in_production_extremely_long") {
      throw new Error("FATAL: AUTH_SECRET / OPS_JWT_SECRET is missing or matches default fallback!");
    }

    const sessionMinutes = parseInt(process.env.OPS_SESSION_TIMEOUT_MINUTES || "480", 10);

    // 1. Verify brute-force lockout status from SQLite
    const now = Date.now();
    const lockout = await LockoutManager.getLockout(ip);
    if (lockout && now < lockout.lockUntil) {
      const waitSeconds = Math.ceil((lockout.lockUntil - now) / 1000);
      return NextResponse.json(
        { code: "LOCKED_OUT", message: `Too many login failures. Please wait ${waitSeconds} seconds.` },
        { status: 429 }
      );
    }

    if (username === expectedUsername && password === expectedPassword) {
      // Clear lockout attempts on success
      await LockoutManager.clearLockout(ip);

      const mockUser = {
        id: "usr-admin-01",
        username: expectedUsername,
        email: "admin@ai-ops.local",
        role: "admin",
      };

      const expires = Date.now() + sessionMinutes * 60 * 1000;
      const token = signToken({ username, role: "admin", expires }, jwtSecret);

      const response = NextResponse.json({
        user: mockUser,
        token,
      });

      // Set Secure, HttpOnly cookie with SameSite: strict
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

    // 2. Increment failed login attempts count for IP in SQLite
    const updatedLockout = await LockoutManager.incrementLockout(ip);
    if (updatedLockout.attempts >= 5) {
      console.warn(`[Proxy Security] IP ${ip} has been locked out due to brute force attempts.`);
    }

    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid username or password" },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("[Login API Error]", error);
    return NextResponse.json(
      { code: "BAD_REQUEST", message: error?.message || "Invalid request payload" },
      { status: 400 }
    );
  }
}
