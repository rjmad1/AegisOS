import { describe, it, expect } from "vitest";
import { GroupClaimRoleMapper } from "@/platform/auth/GroupClaimRoleMapper";

describe("GroupClaimRoleMapper", () => {
  it("should map standard corporate group names to AegisOS roles", () => {
    const mapper = new GroupClaimRoleMapper();
    const roles = mapper.mapGroupsToRoles(["Domain Admins", "AegisOS-SRE"]);

    expect(roles).toContain("SRE");
    expect(roles).toContain("Admin");
  });

  it("should map LDAP Distinguished Names (DN) via substring matching", () => {
    const mapper = new GroupClaimRoleMapper();
    const roles = mapper.mapGroupsToRoles([
      "CN=AegisOS-SuperAdmins,OU=Groups,DC=company,DC=com"
    ]);

    expect(roles).toContain("Admin");
    expect(roles).toContain("SRE");
  });

  it("should default to User role when no explicit mapping rules match", () => {
    const mapper = new GroupClaimRoleMapper();
    const roles = mapper.mapGroupsToRoles(["Unrecognized-Department-Group"]);

    expect(roles).toEqual(["User"]);
  });
});
