// tests/unit/infrastructure/monitoring.test.ts
// Unit tests for AegisOS Infrastructure Monitoring & Mission Control API endpoints

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("Infrastructure Monitoring API Endpoints", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.AUTH_SECRET = "test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should return hardware status metrics on GET status", async () => {
    const { GET } = await import("@/app/api/v1/mobile/infrastructure/status/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.cpu).toBeDefined();
    expect(body.cpu.load).toBeDefined();
    expect(body.cpu.cores).toBeDefined();
    expect(body.memory).toBeDefined();
    expect(body.memory.total).toBeDefined();
    expect(body.memory.percent).toBeDefined();
    expect(body.gpu).toBeDefined();
    expect(body.disk).toBeDefined();
    expect(body.network).toBeDefined();
    expect(body.battery).toBeDefined();
    expect(body.uptime).toBeDefined();
  });

  it("should return running statuses for all target services on GET services", async () => {
    const { GET } = await import("@/app/api/v1/mobile/infrastructure/services/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const serviceNames = body.map((s: any) => s.name);
    expect(serviceNames).toContain("Ollama");
    expect(serviceNames).toContain("LiteLLM");
    expect(serviceNames).toContain("PostgreSQL");
    expect(serviceNames).toContain("Redis");

    const firstService = body[0];
    expect(firstService.name).toBeDefined();
    expect(firstService.status).toBeDefined();
    expect(firstService.description).toBeDefined();
  });

  it("should return loaded models, VRAM allocations and queues on GET models", async () => {
    const { GET } = await import("@/app/api/v1/mobile/infrastructure/models/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.currentModel).toBeDefined();
    expect(body.currentModel.displayName).toBeDefined();
    expect(body.loadedModels).toBeDefined();
    expect(Array.isArray(body.loadedModels)).toBe(true);
    expect(body.vramUsage).toBeDefined();
    expect(body.vramUsage.totalBytes).toBeDefined();
    expect(body.vramUsage.percent).toBeDefined();
    expect(body.inference).toBeDefined();
    expect(body.inference.queueSize).toBeDefined();
    expect(body.inference.tokensPerSec).toBeDefined();
  });

  it("should return registered system agents and state logs on GET agents", async () => {
    const { GET } = await import("@/app/api/v1/mobile/infrastructure/agents/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);

    const agent = body[0];
    expect(agent.id).toBeDefined();
    expect(agent.name).toBeDefined();
    expect(agent.role).toBeDefined();
    expect(agent.state).toBeDefined();
    expect(agent.metrics).toBeDefined();
    expect(agent.metrics.invocations).toBeDefined();
  });

  it("should return events list from the central event bus on GET events", async () => {
    const { GET } = await import("@/app/api/v1/mobile/infrastructure/events/route");
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
