// tests/unit/auth/mobile-auth.test.ts
// Unit tests for the mobile pairing, onboarding, and session rotation endpoints

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "@/infrastructure/db/prisma";

// Mock the session service globally to prevent request-scope cookie errors during unit testing
vi.mock("@/platform/auth/session.service", () => {
  return {
    default: {
      getSession: vi.fn(),
      createSession: vi.fn(),
      deleteSession: vi.fn(),
    },
  };
});

describe("Mobile Pairing & Onboarding Security Endpoints", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = "test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890";
    
    // Clear dynamic states
    await prisma.mobileRefreshToken.deleteMany({});
    await prisma.mobileSession.deleteMany({});
    await prisma.mobileDevice.deleteMany({});
    await prisma.pairingChallenge.deleteMany({});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should generate a pairing challenge token, code andEndpoints via GET", async () => {
    const { GET } = await import("@/app/api/v1/mobile/auth/pair/route");

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.token).toBeDefined();
    expect(body.code).toBeDefined();
    expect(body.code).toMatch(/^AEGIS-\d{3}-\d{3}$/);
    expect(body.endpoints).toBeDefined();
    expect(body.endpoints.length).toBeGreaterThan(0);
  });

  it("should register device as PENDING via POST with a valid challenge token", async () => {
    const { GET, POST } = await import("@/app/api/v1/mobile/auth/pair/route");

    // 1. Generate challenge
    const getRes = await GET();
    const challenge = await getRes.json();

    // 2. Pair device
    const mockPublicKey = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9wQ8R1wM2H/mockKey";
    const request = new Request("http://localhost:3000/api/v1/mobile/auth/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairingToken: challenge.token,
        publicKey: mockPublicKey,
        deviceName: "Test Companion App",
        metadata: { os: "iOS", model: "iPhone 15" }
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.deviceId).toBeDefined();
    expect(body.status).toBe("PENDING");
  });

  it("should reject pairing if challenge token is expired", async () => {
    const { POST } = await import("@/app/api/v1/mobile/auth/pair/route");

    // Seed expired challenge
    const token = "expired-token-uuid";
    await prisma.pairingChallenge.create({
      data: {
        token,
        code: "AEGIS-111-222",
        expiresAt: new Date(Date.now() - 1000), // 1s ago
        used: false,
      }
    });

    const request = new Request("http://localhost:3000/api/v1/mobile/auth/pair", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pairingToken: token,
        publicKey: "mockPublicKey",
        deviceName: "Test Client",
        metadata: {}
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    
    const body = await response.json();
    expect(body.message).toContain("expired");
  });

  it("should allow an Administrator to approve a pending device", async () => {
    const { POST: approvePost } = await import("@/app/api/v1/mobile/auth/approve/route");
    const sessionService = (await import("@/platform/auth/session.service")).default;

    // Seed a pending device
    const deviceId = "test-device-uuid";
    await prisma.mobileDevice.create({
      data: {
        id: deviceId,
        name: "Test Device",
        publicKey: "mockKey",
        fingerprint: "test-fingerprint-sha256",
        status: "PENDING",
        metadata: "{}"
      }
    });

    // Mock admin session
    vi.mocked(sessionService.getSession).mockResolvedValue({
      id: "usr-admin-01",
      userId: "usr-admin-01",
      role: "Administrator",
      createdAt: Date.now(),
      lastActive: Date.now(),
    });

    const request = new Request("http://localhost:3000/api/v1/mobile/auth/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId }),
    });

    const response = await approvePost(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe("APPROVED");

    // Verify DB update
    const dbDevice = await prisma.mobileDevice.findUnique({ where: { id: deviceId } });
    expect(dbDevice?.status).toBe("APPROVED");
  });

  it("should establish session on signed challenge, and support refresh rotation", async () => {
    // Seed approved device
    const deviceId = "test-approved-device";
    await prisma.mobileDevice.create({
      data: {
        id: deviceId,
        name: "Approved Device",
        publicKey: `-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9wQ8R1wM2H/mockKey\n-----END PUBLIC KEY-----`,
        fingerprint: "approved-fingerprint",
        status: "APPROVED",
        metadata: "{}"
      }
    });

    const { POST: sessionPost } = await import("@/app/api/v1/mobile/auth/session/route");

    // Mock cryptography check in mobile-auth.service to succeed for test run
    const serviceModule = await import("@/platform/auth/mobile-auth.service");
    vi.spyOn(serviceModule.mobileAuthService as any, "verifySignature").mockReturnValue(true);

    // 1. Establish session
    const request = new Request("http://localhost:3000/api/v1/mobile/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        challenge: "12345678",
        signature: "valid-signature-base64",
      }),
    });

    const response = await sessionPost(request);
    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body.jwt).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.expiresAt).toBeDefined();

    // 2. Refresh Token Rotation (RTR)
    const refreshRequest = new Request("http://localhost:3000/api/v1/mobile/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        refreshToken: body.refreshToken,
      }),
    });

    const refreshResponse = await sessionPost(refreshRequest);
    expect(refreshResponse.status).toBe(200);

    const refreshBody = await refreshResponse.json();
    expect(refreshBody.jwt).toBeDefined();
    expect(refreshBody.refreshToken).toBeDefined();
    expect(refreshBody.refreshToken).not.toBe(body.refreshToken); // Must rotate
  });

  it("should support administrator listing and revoking paired devices", async () => {
    // Seed approved device
    const deviceId = "device-to-revoke";
    await prisma.mobileDevice.create({
      data: {
        id: deviceId,
        name: "Active Device",
        publicKey: "mockKey",
        fingerprint: "revoke-fingerprint",
        status: "APPROVED",
        metadata: "{}"
      }
    });

    const sessionService = (await import("@/platform/auth/session.service")).default;
    // Mock admin session
    vi.mocked(sessionService.getSession).mockResolvedValue({
      id: "usr-admin-01",
      userId: "usr-admin-01",
      role: "Administrator",
      createdAt: Date.now(),
      lastActive: Date.now(),
    });

    const { GET: devicesGet } = await import("@/app/api/v1/mobile/auth/devices/route");
    const { DELETE: deviceDelete } = await import("@/app/api/v1/mobile/auth/device/[id]/route");

    // 1. List devices
    const listRes = await devicesGet();
    expect(listRes.status).toBe(200);
    const devicesList = await listRes.json();
    expect(devicesList.length).toBeGreaterThan(0);
    expect(devicesList[0].id).toBe(deviceId);

    // 2. Revoke device
    const deleteRes = await deviceDelete(
      new Request(`http://localhost:3000/api/v1/mobile/auth/device/${deviceId}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: deviceId }) }
    );
    expect(deleteRes.status).toBe(200);

    // Verify revoked status in DB
    const dbDevice = await prisma.mobileDevice.findUnique({ where: { id: deviceId } });
    expect(dbDevice?.status).toBe("REVOKED");
  });
});
