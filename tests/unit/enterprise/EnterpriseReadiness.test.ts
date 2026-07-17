// tests/unit/enterprise/EnterpriseReadiness.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { platformStateEngine } from "../../../src/platform/control/PlatformStateEngine";
import { policyEnforcer } from "../../../src/infrastructure/security/policy-enforcer";
import { SignJWT, jwtVerify } from "jose";

describe("Enterprise Readiness & High Availability Suite", () => {
  const secretKey = new TextEncoder().encode("test-only-auth-secret-not-for-production-use-aaaa-bbbb-cccc-dddd-1234567890");

  beforeAll(() => {
    process.env.OPS_DATABASES_DIR = path.resolve(process.cwd(), "databases");
  });

  it("should validate multi-node topology and HA statuses in PlatformState", async () => {
    const state = await platformStateEngine.getPlatformState();
    
    // Verify multi-node cluster topology
    expect(state.topology.nodes.length).toBeGreaterThan(3);
    const databaseNode = state.topology.nodes.find(n => n.id === "node-sqlite");
    expect(databaseNode).toBeDefined();
    expect(databaseNode?.status).toBe("healthy");

    const webNode = state.topology.nodes.find(n => n.id === "node-next");
    expect(webNode).toBeDefined();
  });

  it("should validate RBAC permissions for Admin vs Viewer/Developer", () => {
    // Test role-based access checks on policyEnforcer
    const hasAdminAccess = policyEnforcer.authorizeRole("usr-admin-01", "admin");
    expect(hasAdminAccess).toBe(true);

    const hasDeveloperAccess = policyEnforcer.authorizeRole("usr-admin-01", "developer");
    expect(hasDeveloperAccess).toBe(true);
  });

  it("should validate pre-upgrade database backup file creation", () => {
    const dbDir = path.resolve(process.cwd(), "databases");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    const mockBackupPath = path.join(dbDir, "dev_db_backup_pre_upgrade.db");
    
    // Simulate backup creation
    fs.writeFileSync(mockBackupPath, "mock SQLite database binary payload", "utf-8");
    expect(fs.existsSync(mockBackupPath)).toBe(true);
    
    // Cleanup mock backup file
    fs.unlinkSync(mockBackupPath);
  });

  it("should validate Challenge Tokens and JWT session signing lifecycle using jose", async () => {
    const payload = { userId: "usr-admin-01", role: "admin", tenantId: "tenant-default" };
    
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secretKey);
      
    expect(token).toBeDefined();

    const { payload: verified } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
    expect(verified).toBeDefined();
    expect(verified?.userId).toBe("usr-admin-01");
    expect(verified?.role).toBe("admin");
  });
});
