// tests/unit/infrastructure/security/secrets-platform.test.ts
// Unit tests for the secrets platform encryption key derivation and security guards.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Secrets Platform Security", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw if OPS_JWT_SECRET is not set", async () => {
    delete process.env.OPS_JWT_SECRET;

    await expect(
      import("@/infrastructure/security/secrets-platform")
    ).rejects.toThrow("OPS_JWT_SECRET");
  });

  it("should not throw when OPS_JWT_SECRET is properly configured", async () => {
    process.env.OPS_JWT_SECRET = "test-only-jwt-secret-not-for-production-use-eeee-ffff-0000-1111-0987654321";

    await expect(
      import("@/infrastructure/security/secrets-platform")
    ).resolves.toBeDefined();
  });
});
