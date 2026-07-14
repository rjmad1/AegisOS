// tests/unit/auth/login-route.test.ts
// Unit tests for the login API route security guards.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Login Route Security Guards", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Set valid environment for tests
    process.env.AUTH_SECRET = "test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890";
    process.env.OPS_JWT_SECRET = "test-only-jwt-secret-not-for-production-use-eeee-ffff-0000-1111-0987654321";
    process.env.OPS_ADMIN_USERNAME = "test-admin";
    process.env.OPS_ADMIN_PASSWORD = "TestOnlyPassword!NotForProduction";
    process.env.GOOGLE_CLIENT_ID = "test-only-google-client-id.example.com";
    process.env.GOOGLE_CLIENT_SECRET = "test-only-google-client-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should reject login with incorrect credentials", async () => {
    const { POST } = await import("@/app/api/v1/auth/login/route");

    const request = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wrong", password: "wrong" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.code).toBe("UNAUTHORIZED");
  });

  it("should reject when OPS_ADMIN_USERNAME is 'admin' (insecure default)", async () => {
    process.env.OPS_ADMIN_USERNAME = "admin";

    const { POST } = await import("@/app/api/v1/auth/login/route");

    const request = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "test" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.message).toContain("insecure");
  });

  it("should reject when AUTH_SECRET matches a known insecure default", async () => {
    process.env.AUTH_SECRET = "super-secret-random-hash-key-for-console-jwt-signing-2026";

    const { POST } = await import("@/app/api/v1/auth/login/route");

    const request = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "test-admin", password: "TestOnlyPassword!NotForProduction" }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.message).toContain("AUTH_SECRET");
  });

  it("should return a JWT token on successful login", async () => {
    const { POST } = await import("@/app/api/v1/auth/login/route");

    const request = new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "test-admin",
        password: "TestOnlyPassword!NotForProduction",
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.user.role).toBe("Administrator");

    // Verify JWT has 3 parts
    const parts = body.token.split(".");
    expect(parts).toHaveLength(3);
  });
});
