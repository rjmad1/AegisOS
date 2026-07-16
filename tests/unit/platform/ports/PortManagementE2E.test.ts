// tests/unit/platform/ports/PortManagementE2E.test.ts
// End-to-end integration test validating the entire port management, remapping, and validation lifecycle.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PortRegistry } from "@/platform/ports/PortRegistry";
import { PortValidator } from "@/platform/ports/PortValidator";

describe("Port Management System — End-to-End Integration & Hardening Suite", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    // Reset process.env properties
    for (const key of Object.keys(process.env)) {
      if (key.startsWith("HOST_PORT_") || key.startsWith("NEXT_PUBLIC_") || key.includes("OLLAMA") || key.includes("LITELLM") || key.includes("AEGISOS")) {
        delete process.env[key];
      }
    }
    // Delete global.window to ensure we evaluate in pure Node environment
    delete (global as any).window;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Restore original env
    process.env = { ...originalEnv };
  });

  // 1. Validate Default Un-remapped Configuration
  it("should boot successfully and resolve default urls under normal conditions", () => {
    // Assert all default ports are resolved from the registry fallback
    expect(PortRegistry.getHostPort("console")).toBe(3000);
    expect(PortRegistry.getHostPort("litellm")).toBe(4000);
    expect(PortRegistry.getHostPort("ollama")).toBe(11434);
    expect(PortRegistry.getHostPort("postgres")).toBe(5432);

    expect(PortRegistry.getServiceUrl("litellm")).toBe("http://127.0.0.1:4000");
    expect(PortRegistry.getServiceUrl("ollama")).toBe("http://127.0.0.1:11434");

    // PortValidator must pass cleanly
    expect(() => PortValidator.validate()).not.toThrow();
  });

  // 2. Validate Remap and Offset Propagation Flow
  it("should dynamically resolve remapped host ports and URLs when overrides are simulated", () => {
    // Simulate PortManager's environment updates (conflict detected on 4000, 11434, 5432)
    vi.stubEnv("HOST_PORT_LITELLM", "14000");
    vi.stubEnv("HOST_PORT_OLLAMA", "21434");
    vi.stubEnv("HOST_PORT_POSTGRES", "15432");

    // Frontend Next.js resolution variables matching PortManager output
    vi.stubEnv("NEXT_PUBLIC_LITELLM_URL", "http://127.0.0.1:14000");
    vi.stubEnv("NEXT_PUBLIC_OLLAMA_URL", "http://127.0.0.1:21434");

    // Verify Registry correctly prioritizes these overrides
    expect(PortRegistry.getHostPort("litellm")).toBe(14000);
    expect(PortRegistry.getHostPort("ollama")).toBe(21434);
    expect(PortRegistry.getHostPort("postgres")).toBe(15432);

    // Verify URL compilation
    expect(PortRegistry.getServiceUrl("litellm")).toBe("http://127.0.0.1:14000");
    expect(PortRegistry.getServiceUrl("ollama")).toBe("http://127.0.0.1:21434");

    // PortValidator must still pass (as mappings are shifted but still unique)
    expect(() => PortValidator.validate()).not.toThrow();
  });

  // 3. Validate Collision Isolation & System Halt
  it("should halt the platform boot if a port collision is introduced", () => {
    // Introduce a port collision: both LiteLLM and Ollama resolved to 11434
    vi.stubEnv("HOST_PORT_LITELLM", "11434");
    vi.stubEnv("HOST_PORT_OLLAMA", "11434");

    // PortValidator must intercept and raise a fatal error to halt the boot sequence
    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed. Duplicate or invalid host ports detected!"
    );
  });

  // 4. Validate Range Boundary Guard
  it("should halt the platform boot if an out-of-range port is mapped", () => {
    // Upper bound overflow
    vi.stubEnv("HOST_PORT_LITELLM", "65536");
    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed"
    );

    // Lower bound underflow
    vi.stubEnv("HOST_PORT_LITELLM", "0");
    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed"
    );

    // Negative port
    vi.stubEnv("HOST_PORT_LITELLM", "-50");
    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed"
    );
  });
});
