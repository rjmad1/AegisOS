import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { telemetryTracker } from "@/infrastructure/observability/telemetry";
import { metricsPlatform } from "@/infrastructure/observability/metrics-platform";
import redisPlatform from "@/infrastructure/providers/redis-platform";

const authSecret = process.env.AUTH_SECRET;

// Blocklist of known-insecure default secrets that must never be used
const INSECURE_SECRETS = new Set([
  "super-secret-random-hash-key-for-console-jwt-signing-2026",
  "fallback_secret_must_change_in_production_extremely_long",
  "build-time-placeholder-not-a-real-secret-minimum-length-required-for-compilation",
  "",
]);

if (!authSecret || INSECURE_SECRETS.has(authSecret)) {
  throw new Error("FATAL: AUTH_SECRET environment variable is missing or insecure!");
}

const key = new TextEncoder().encode(authSecret);

const RATE_LIMIT_MAX = parseInt(process.env.OPS_RATE_LIMIT_MAX || "150", 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.OPS_RATE_LIMIT_WINDOW_MS || "60000", 10);

// Helper to determine the required permission based on HTTP path and method
function getRequiredPermission(pathname: string, method: string): string | null {
  const isWrite = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  if (pathname.startsWith("/api/v1/admin/secrets") || pathname.startsWith("/api/v1/admin/users")) {
    return "Administration";
  }
  if (pathname.startsWith("/api/v1/workflows") || pathname.startsWith("/api/v1/jobs") || pathname.startsWith("/api/v1/executions")) {
    return isWrite ? "Administration" : "ViewRuntime";
  }
  if (pathname.startsWith("/api/v1/infrastructure")) {
    return "ViewInfrastructure";
  }
  if (pathname.startsWith("/api/v1/knowledge")) {
    return "ViewKnowledge";
  }
  if (pathname.startsWith("/api/v1/models") || pathname.startsWith("/api/v1/providers")) {
    return "ViewModels";
  }
  if (pathname.startsWith("/api/v1/conversations")) {
    return "ViewConversations";
  }
  if (pathname.startsWith("/api/v1/events") || pathname.startsWith("/api/v1/metrics")) {
    return "ViewLogs";
  }
  if (pathname.startsWith("/api/v1/diagnostics") || pathname.startsWith("/api/v1/status") || pathname.startsWith("/api/v1/runtime/health")) {
    return "ViewHealth";
  }
  if (pathname.startsWith("/api/v1/configuration") || pathname.startsWith("/api/v1/system")) {
    return "ViewSettings";
  }
  if (pathname.startsWith("/api/v1/reliability")) {
    return "ViewInfrastructure";
  }
  
  // Default to ViewRuntime for general API endpoints
  if (pathname.startsWith("/api/v1")) {
    return "ViewRuntime";
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets early
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname === "/globals.css"
  ) {
    return NextResponse.next();
  }

  // Check trace context headers (Trace Context Propagation)
  const incomingTraceParent = request.headers.get("traceparent") || undefined;
  const incomingBaggage = request.headers.get("baggage") || undefined;
  
  const parsedTrace = telemetryTracker.parseTraceParent(incomingTraceParent);
  const parsedBaggage = telemetryTracker.parseBaggage(incomingBaggage);

  const context = telemetryTracker.createTrace(
    parsedTrace?.traceId,
    parsedTrace?.activeSpanId,
    parsedBaggage
  );

  const spanId = telemetryTracker.startSpan(
    context.traceId,
    `HTTP ${request.method} ${pathname}`,
    context.activeSpanId,
    {
      "http.method": request.method,
      "http.target": pathname,
      "client.ip": request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"
    }
  );

  const startTime = Date.now();
  metricsPlatform.counter("api_requests_total", 1, { method: request.method, path: pathname });

  try {
    const res = await executeProxySecurityAndRouting(request);
    const duration = Date.now() - startTime;
    metricsPlatform.gauge("api_latency_ms", duration, { method: request.method, path: pathname });

    if (res.status >= 400) {
      metricsPlatform.counter("api_errors_total", 1, { method: request.method, path: pathname, status: String(res.status) });
      telemetryTracker.endSpan(context.traceId, spanId, {
        status: "failed",
        error: true,
        errorMessage: `HTTP Error ${res.status}`,
        "http.status_code": res.status
      });
    } else {
      telemetryTracker.endSpan(context.traceId, spanId, {
        status: "succeeded",
        "http.status_code": res.status
      });
    }

    res.headers.set("traceparent", `00-${context.traceId}-${spanId}-01`);
    return res;
  } catch (err: any) {
    const duration = Date.now() - startTime;
    metricsPlatform.gauge("api_latency_ms", duration, { method: request.method, path: pathname });
    metricsPlatform.counter("api_errors_total", 1, { method: request.method, path: pathname, status: "500" });

    telemetryTracker.endSpan(context.traceId, spanId, {
      status: "failed",
      error: true,
      errorMessage: err.message,
      "http.status_code": 500
    });

    const errResponse = new NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
    errResponse.headers.set("traceparent", `00-${context.traceId}-${spanId}-01`);
    return errResponse;
  }
}

async function executeProxySecurityAndRouting(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";

  const isAuthRoute =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1/auth") ||
    pathname === "/live" ||
    pathname === "/ready" ||
    pathname === "/health" ||
    pathname === "/status" ||
    pathname === "/login" ||
    pathname === "/unauthorized";

  // 1. Rate Limiting Check
  const rateLimitResult = await redisPlatform.rateLimit.checkRateLimit(`ip:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please slow down." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Request Size & API Key check
  if (!isAuthRoute) {
    const contentLength = parseInt(request.headers.get("content-length") || "0", 10);
    if (contentLength > 5 * 1024 * 1024) { // 5MB limit
      return new NextResponse(JSON.stringify({ error: "Payload too large. Limit is 5MB." }), { status: 413 });
    }

    const apiKey = request.headers.get("x-api-key");
    const apiSig = request.headers.get("x-api-signature");
    const apiTs = request.headers.get("x-api-timestamp");
    if (apiKey) {
      if (!apiSig || !apiTs) {
        return new NextResponse(JSON.stringify({ error: "Missing API request signature or timestamp headers" }), { status: 400 });
      }
      const nowTs = Date.now();
      const reqTime = parseInt(apiTs, 10);
      if (isNaN(reqTime) || Math.abs(nowTs - reqTime) > 5 * 60 * 1000) {
        return new NextResponse(JSON.stringify({ error: "API Request timestamp expired or clock skew too high" }), { status: 400 });
      }
      if (apiSig.length !== 64) {
        return new NextResponse(JSON.stringify({ error: "Invalid API signature" }), { status: 401 });
      }
    }
  }

  // 3. CSRF Validation
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method) && !isAuthRoute) {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || "";

    if (origin) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return new NextResponse(JSON.stringify({ error: "CSRF Blocked" }), { status: 403 });
      }
    } else if (referer) {
      const refererUrl = new URL(referer);
      if (refererUrl.host !== host) {
        return new NextResponse(JSON.stringify({ error: "CSRF Blocked" }), { status: 403 });
      }
    }
  }

  // 4. Zero Trust Intrusion & Authorization checks
  if (!isAuthRoute) {
    const token = request.cookies.get("ops_auth_token")?.value || 
                  request.headers.get("Authorization")?.split(" ")[1];
    
    if (!token) {
      if (pathname.startsWith("/api")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const requiredPermission = getRequiredPermission(pathname, request.method);
      const introspectUrl = new URL("/api/v1/auth/token/introspect", request.url);
      const verifyRes = await fetch(introspectUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, clientIp: ip, requiredPermission }),
      });

      if (!verifyRes.ok) {
        throw new Error("Introspection service failed");
      }

      const check = await verifyRes.json();
      if (!check.active) {
        throw new Error(check.reason || "Session inactive or revoked");
      }

      if (requiredPermission && !check.authorized) {
        if (pathname.startsWith("/api")) {
          return new NextResponse(JSON.stringify({ error: "Forbidden", reason: check.reason }), { status: 403 });
        }
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

      if (pathname.startsWith("/admin") && check.role !== "Administrator" && check.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }

    } catch (err: any) {
      console.error(`[Security Proxy] Authorization failed for ${pathname}:`, err.message);
      if (pathname.startsWith("/api")) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized", reason: err.message }), { status: 401 });
      }
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("ops_auth_token");
      return response;
    }
  }

  // 5. Response headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; object-src 'none';"
  );
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
