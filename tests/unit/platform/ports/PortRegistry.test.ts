// tests/unit/platform/ports/PortRegistry.test.ts
// Unit tests for the dynamic PortRegistry and PortValidator components.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PortRegistry } from "@/platform/ports/PortRegistry";
import { PortValidator } from "@/platform/ports/PortValidator";

describe("PortRegistry and PortValidator", () => {
  beforeEach(() => {
    vi.resetModules();
    PortRegistry.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should retrieve default host ports when no environment variables are set", () => {
    // Clear overrides
    vi.stubEnv("HOST_PORT_OLLAMA", "");
    vi.stubEnv("HOST_PORT_LITELLM", "");

    const ollamaPort = PortRegistry.getHostPort("ollama");
    const litellmPort = PortRegistry.getHostPort("litellm");

    expect(ollamaPort).toBe(11434);
    expect(litellmPort).toBe(4000);
  });

  it("should prioritize environmental overrides for host ports", () => {
    vi.stubEnv("HOST_PORT_OLLAMA", "21434");
    vi.stubEnv("HOST_PORT_LITELLM", "14000");

    const ollamaPort = PortRegistry.getHostPort("ollama");
    const litellmPort = PortRegistry.getHostPort("litellm");

    expect(ollamaPort).toBe(21434);
    expect(litellmPort).toBe(14000);
  });

  it("should dynamically compute service URLs incorporating overrides", () => {
    vi.stubEnv("HOST_PORT_LITELLM", "14000");

    const url = PortRegistry.getServiceUrl("litellm");
    expect(url).toBe("http://127.0.0.1:14000");
  });

  it("should successfully pass validation on default configuration", () => {
    expect(() => PortValidator.validate()).not.toThrow();
  });

  it("should throw a fatal error if duplicate host port mappings are detected", () => {
    // Force a collision by remapping LiteLLM to Ollama's port
    vi.stubEnv("HOST_PORT_LITELLM", "11434");

    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed"
    );
  });

  it("should throw a fatal error if port ranges are exceeded or out of bounds", () => {
    // Set an invalid port range
    vi.stubEnv("HOST_PORT_LITELLM", "70000");

    expect(() => PortValidator.validate()).toThrow(
      "FATAL: Port configuration validation failed"
    );
  });
});
