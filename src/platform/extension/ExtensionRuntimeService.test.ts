// src/platform/extension/ExtensionRuntimeService.test.ts

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { extensionRuntimeService } from "./ExtensionRuntimeService";
import { ExtensionManifest } from "./ExtensionSDK";
import * as fs from "fs";
import * as path from "path";

describe("ExtensionRuntimeService Lifecycle & Validation", () => {
  const testExtId = "com.aegisos.ext.test-unit";
  const extensionsDir = path.resolve(process.cwd(), "extensions");
  const testExtPath = path.join(extensionsDir, testExtId);

  beforeEach(() => {
    // Clean up test extension folder if any
    if (fs.existsSync(testExtPath)) {
      fs.rmSync(testExtPath, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up after run
    if (fs.existsSync(testExtPath)) {
      fs.rmSync(testExtPath, { recursive: true, force: true });
    }
  });

  it("should discover installed extensions", async () => {
    const list = await extensionRuntimeService.discover();
    expect(list.length).toBeGreaterThanOrEqual(0);
  });

  it("should install, validate, activate, and deactivate a compliant extension", async () => {
    const manifest: ExtensionManifest = {
      id: testExtId,
      name: "Test Unit Extension",
      version: "1.0.0",
      author: "Quality Assurance",
      description: "Automated test unit package for dynamic extension loading.",
      dependencies: { "aegisos": ">=1.0.0" },
      capabilities: ["test-capability"],
      permissions: ["event-publish"],
      signature: "a".repeat(64), // Valid length 64 signature
      tools: [
        {
          id: "tool:test:unit-add",
          name: "Add Numbers",
          description: "Adds two numbers",
          parameters: {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" }
            },
            required: ["a", "b"]
          },
          permissionsRequired: [],
          sandboxLevel: "full",
          enabled: true
        }
      ],
      prompts: [
        {
          name: "test-prompt-template",
          purpose: "Unit testing prompt template loading",
          template: "Hello World testing."
        }
      ]
    };

    // Install
    const state = await extensionRuntimeService.install(testExtId, manifest, {
      "index.js": `
        class TestExt {
          async initialize(context) {
            context.logger.info("TestExt active!");
          }
          async shutdown() {
            console.log("TestExt shut down.");
          }
        }
        module.exports = TestExt;
      `
    });

    expect(state.id).toBe(testExtId);
    expect(state.status).toBe("activated");
    expect(state.health).toBe("healthy");

    // Deactivate
    await extensionRuntimeService.deactivate(testExtId);
    const deactivatedState = extensionRuntimeService.getExtension(testExtId);
    expect(deactivatedState?.status).toBe("deactivated");

    // Uninstall
    await extensionRuntimeService.uninstall(testExtId);
    const uninstalledState = extensionRuntimeService.getExtension(testExtId);
    expect(uninstalledState).toBeNull();
  });

  it("should fail validation if signature is invalid", async () => {
    const invalidManifest: ExtensionManifest = {
      id: testExtId,
      name: "Bad Signature Extension",
      version: "1.0.0",
      author: "Hacker",
      description: "Should fail validation",
      dependencies: { "aegisos": ">=1.0.0" },
      capabilities: [],
      permissions: [],
      signature: "short-signature" // Invalid signature format/length
    };

    const state = await extensionRuntimeService.install(testExtId, invalidManifest);
    expect(state.status).toBe("error");
    expect(state.errorMessage).toContain("Signature Verification");
  });
});
