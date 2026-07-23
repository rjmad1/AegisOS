// tests/unit/services/admin-service.test.ts
import { describe, it, expect } from "vitest";
import { adminService, AdminService } from "../../../src/services/admin.service";

describe("AdminService", () => {
  it("should export a singleton adminService instance", () => {
    expect(adminService).toBeInstanceOf(AdminService);
  });

  it("should provide access to all core platform repositories", () => {
    expect(adminService.users).toBeDefined();
    expect(adminService.audit).toBeDefined();
    expect(adminService.secrets).toBeDefined();
    expect(adminService.licenses).toBeDefined();
    expect(adminService.config).toBeDefined();
    expect(adminService.roles).toBeDefined();
    expect(adminService.jobs).toBeDefined();
    expect(adminService.featureFlags).toBeDefined();
  });
});
