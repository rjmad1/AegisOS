import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

// In-memory rate limiting map: IP -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// In-memory brute force map: IP -> { attempts, lockUntil }
const loginLockoutMap = new Map<string, { attempts: number; lockUntil: number }>();

// Load configurations or defaults
const JWT_SECRET = process.env.OPS_JWT_SECRET || "super-secret-random-hash-key-for-console-jwt-signing-2026";
const RATE_LIMIT_MAX = parseInt(process.env.OPS_RATE_LIMIT_MAX || "150", 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.OPS_RATE_LIMIT_WINDOW_MS || "60000", 10);

// Helper to verify custom JWT token signature (using native crypto)
function verifyToken(token: string, secret: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${data}`)
      .digest("base64url");
    
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.expires && Date.now() > payload.expires) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// Next.js 16 Named Proxy Hook
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

  // 1. Static Assets & Login Exemptions
  const isStatic =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/globals.css";

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/api/v1/auth/login";

  const isHealthRoute =
    pathname === "/health" ||
    pathname === "/ready" ||
    pathname === "/live";

  // 2. Rate Limiting Check (all non-static requests)
  if (!isStatic) {
    const now = Date.now();
    let limitData = rateLimitMap.get(ip);
    if (!limitData || now > limitData.resetTime) {
      limitData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    }
    limitData.count++;
    rateLimitMap.set(ip, limitData);

    if (limitData.count > RATE_LIMIT_MAX) {
      console.warn(`[Proxy Security] Rate limit exceeded by IP: ${ip}`);
      return new NextResponse(
        JSON.stringify({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please slow down." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  // 3. Brute Force Protection on Login
  if (pathname === "/api/v1/auth/login") {
    const now = Date.now();
    const lockout = loginLockoutMap.get(ip);
    if (lockout && now < lockout.lockUntil) {
      const waitSeconds = Math.ceil((lockout.lockUntil - now) / 1000);
      console.warn(`[Proxy Security] Locked out login attempt from IP: ${ip}`);
      return new NextResponse(
        JSON.stringify({
          code: "LOCKED_OUT",
          message: `Brute force protection active. Please wait ${waitSeconds} seconds.`
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }

  // 4. CSRF Validation for State-Mutating requests (POST, PUT, DELETE, PATCH)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method) && !isStatic) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || "";

    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        console.error(`[Proxy Security] CSRF Blocked: origin ${originUrl.host} !== host ${host}`);
        return new NextResponse(
          JSON.stringify({ code: "CSRF_DETECTED", message: "Forbidden - Cross-Site Request Blocked." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        console.error(`[Proxy Security] CSRF Blocked: referer ${refererUrl.host} !== host ${host}`);
        return new NextResponse(
          JSON.stringify({ code: "CSRF_DETECTED", message: "Forbidden - Cross-Site Referer Blocked." }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }

  // 5. Session Cookie Validation for Protected Routes
  if (!isStatic && !isAuthRoute && !isHealthRoute) {
    const cookieToken = request.cookies.get("ops_auth_token")?.value;
    const verified = cookieToken ? verifyToken(cookieToken, JWT_SECRET) : null;

    if (!verified) {
      console.info(`[Proxy Auth] Unauthenticated request to protected route: ${pathname} from IP: ${ip}`);
      
      // If it's an API request, return JSON 401
      if (pathname.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ code: "UNAUTHORIZED", message: "Session expired or invalid. Please sign in again." }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "Set-Cookie": "ops_auth_token=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"
            }
          }
        );
      }

      // Otherwise, redirect to login page
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      const response = NextResponse.redirect(loginUrl);
      // Clear invalid cookie
      response.cookies.delete("ops_auth_token");
      return response;
    }
  }

  // 6. Security Headers injection for all processed requests
  const response = NextResponse.next();
  
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; object-src 'none';"
  );
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  // Set strict transport security in production (HSTS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return response;
}

// Export lockout trackers so login route can increment them on failures
export { loginLockoutMap };
