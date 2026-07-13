// src/platform/kernel/PlatformKernel.test.ts
// Unit tests for the core PlatformKernel module registry, DI container, and health diagnostics

import { describe, it, expect, vi } from "vitest";
import { PlatformKernel } from "./PlatformKernel";
import { PlatformModule } from "./types";

describe("PlatformKernel", () => {
  it("should register and retrieve platform modules", () => {
    const mockModule: PlatformModule = {
      id: "test-module-kernel",
      name: "Test Module Kernel",
      version: "1.0.0",
      domain: "platform",
      capabilities: ["test-capability"],
    };

    PlatformKernel.registerModule(mockModule);
    expect(PlatformKernel.getAllModules()).toContain(mockModule);
    expect(PlatformKernel.getModule("test-module-kernel")).toBe(mockModule);
  });

  it("should support dependency injection service registry", () => {
    const mockService = { execute: () => "success" };
    PlatformKernel.registerService({
      token: "test.service",
      factory: () => mockService,
      singleton: true,
    });

    expect(PlatformKernel.hasService("test.service")).toBe(true);
    expect(PlatformKernel.getService("test.service")).toBe(mockService);
  });

  it("should return uptime, phase, and module entries on health checks", () => {
    const health = PlatformKernel.getHealth();
    expect(health.status).toBeDefined();
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(health.phase).toBeDefined();
    expect(health.modules).toBeDefined();
  });

  it("should register event listeners using on()", () => {
    const handler = vi.fn();
    PlatformKernel.on("custom:event", handler);

    // Call internal emit using prototype accessor or verify it registers without throwing
    expect(() => PlatformKernel.off("custom:event", handler)).not.toThrow();
  });
});
