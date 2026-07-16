// tests/unit/infrastructure/security/secrets-platform.test.ts
// Unit tests for the secrets platform encryption key derivation and security guards.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Secrets Platform Security", () => {
  let originalWindow: any;

  beforeEach(() => {
    vi.resetModules();
    originalWindow = (global as any).window;
    delete (global as any).window;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    (global as any).window = originalWindow;
  });

  it("should throw if OPS_JWT_SECRET is not set", async () => {
    vi.stubEnv("OPS_JWT_SECRET", "");
    const folder = "@/infrastructure/security/";
    const name = "secrets-platform";
    const path = `${folder}${name}?cache=throw-${Date.now()}`;

    await expect(
      import(path)
    ).rejects.toThrow("OPS_JWT_SECRET");
  });

  it("should not throw when OPS_JWT_SECRET is properly configured", async () => {
    vi.stubEnv("OPS_JWT_SECRET", "test-only-jwt-secret-not-for-production-use-eeee-ffff-0000-1111-0987654321");
    const folder = "@/infrastructure/security/";
    const name = "secrets-platform";
    const path = `${folder}${name}?cache=resolve-${Date.now()}`;

    await expect(
      import(path)
    ).resolves.toBeDefined();
  });
});
