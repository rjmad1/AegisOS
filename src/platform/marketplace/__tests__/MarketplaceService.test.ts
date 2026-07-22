import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { marketplaceService } from "../MarketplaceService";
import { extensionRuntimeService } from "../../extension/ExtensionRuntimeService";
import prisma from "../../../infrastructure/db/prisma";

describe("MarketplaceService dynamic capabilities", () => {
  const testPkgId = "com.aegisos.ext.mkt-test";

  beforeEach(async () => {
    try {
      await prisma.artifact.deleteMany({
        where: { id: testPkgId }
      });
      await extensionRuntimeService.uninstall(testPkgId);
    } catch {}
  });

  afterEach(async () => {
    try {
      await prisma.artifact.deleteMany({
        where: { id: testPkgId }
      });
      await extensionRuntimeService.uninstall(testPkgId);
    } catch {}
  });

  it("should publish a signed package to the database and query it", async () => {
    const manifest = {
      id: testPkgId,
      name: "Marketplace Test Extension",
      version: "1.0.0",
      type: "plugin",
      description: "Unit testing for marketplace publishing",
      capabilities: ["mkt-test-cap"],
      dependencies: { aegisos: ">=1.0.0" }
    };
    const signature = "a".repeat(64);

    const publishResult = await marketplaceService.publish(manifest, signature);
    expect(publishResult.success).toBe(true);
    expect(publishResult.artifactId).toBe(testPkgId);
    expect(publishResult.verification.passed).toBe(true);

    const details = await marketplaceService.getDetails(testPkgId);
    expect(details).not.toBeNull();
    expect(details.name).toBe("Marketplace Test Extension");
    expect(details.version).toBe("1.0.0");
    expect(details.trustLevel).toBeGreaterThanOrEqual(50);

    const searchResults = await marketplaceService.search({ text: "Marketplace" });
    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults.some(item => item.id === testPkgId)).toBe(true);
  });

  it("should install a published package and activate its extension", async () => {
    const manifest = {
      id: testPkgId,
      name: "Marketplace Install Extension",
      version: "1.0.0",
      type: "plugin",
      description: "Unit testing for marketplace installer",
      capabilities: ["mkt-install-cap"],
      dependencies: { aegisos: ">=1.0.0" }
    };
    const signature = "a".repeat(64);

    await marketplaceService.publish(manifest, signature);

    const installResult = await marketplaceService.install(testPkgId);
    expect(installResult.success).toBe(true);
    expect(installResult.status).toBe("activated");
    expect(installResult.health).toBe("healthy");

    const uninstallResult = await marketplaceService.uninstall(testPkgId);
    expect(uninstallResult).toBe(true);
  });
});
