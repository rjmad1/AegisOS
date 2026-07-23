// tests/unit/auth/admin-auth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT } from "jose";

let mockCookieValue: string | undefined = undefined;

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === "ops_auth_token" && mockCookieValue) {
        return { value: mockCookieValue };
      }
      return undefined;
    },
  }),
}));

const authSecret = process.env.AUTH_SECRET || "test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890";
const secretKey = new TextEncoder().encode(authSecret);

describe("Admin Authentication Module (getAdminUser)", () => {
  beforeEach(() => {
    mockCookieValue = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return null if ops_auth_token cookie is missing", async () => {
    const { getAdminUser } = await import("../../../src/platform/auth/adminAuth");
    mockCookieValue = undefined;

    const user = await getAdminUser();
    expect(user).toBeNull();
  });

  it("should return null if token contains a non-Administrator role", async () => {
    const { getAdminUser } = await import("../../../src/platform/auth/adminAuth");
    const token = await new SignJWT({ username: "viewer-user", role: "Viewer" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secretKey);

    mockCookieValue = token;

    const user = await getAdminUser();
    expect(user).toBeNull();
  });

  it("should return AdminUserPayload if token contains a valid Administrator role", async () => {
    const { getAdminUser } = await import("../../../src/platform/auth/adminAuth");
    const token = await new SignJWT({ username: "ops-admin", role: "Administrator" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secretKey);

    mockCookieValue = token;

    const user = await getAdminUser();
    expect(user).not.toBeNull();
    expect(user?.username).toBe("ops-admin");
    expect(user?.role).toBe("Administrator");
  });

  it("should return null if token signature is invalid", async () => {
    const { getAdminUser } = await import("../../../src/platform/auth/adminAuth");
    mockCookieValue = "invalid.token.string";

    const user = await getAdminUser();
    expect(user).toBeNull();
  });
});
