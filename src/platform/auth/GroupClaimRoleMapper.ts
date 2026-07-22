export interface GroupRoleMappingRule {
  pattern: string; // Group name, DN string, or regex pattern (e.g. "AegisOS-SRE" or "/^cn=aegisos-admin/i")
  roles: string[];
}

export class GroupClaimRoleMapper {
  private rules: GroupRoleMappingRule[];

  constructor(customRules?: GroupRoleMappingRule[]) {
    this.rules = customRules || [
      { pattern: "Domain Admins", roles: ["SRE", "Admin"] },
      { pattern: "AegisOS-SRE", roles: ["SRE"] },
      { pattern: "AegisOS-Admin", roles: ["Admin"] },
      { pattern: "Developers", roles: ["User", "Developer"] },
      { pattern: "AegisOS-Users", roles: ["User"] },
      { pattern: "CN=AegisOS-SuperAdmins,OU=Groups,DC=company,DC=com", roles: ["Admin", "SRE"] }
    ];

    if (process.env.SAML_ROLE_MAPPINGS_JSON) {
      try {
        const parsed = JSON.parse(process.env.SAML_ROLE_MAPPINGS_JSON);
        if (Array.isArray(parsed)) {
          this.rules.push(...parsed);
        } else if (typeof parsed === 'object') {
          for (const [group, roles] of Object.entries(parsed)) {
            this.rules.push({ pattern: group, roles: Array.isArray(roles) ? roles as string[] : [roles as string] });
          }
        }
      } catch (e) {
        console.error("[GroupClaimRoleMapper] Failed to parse SAML_ROLE_MAPPINGS_JSON env variable:", e);
      }
    }
  }

  /**
   * Resolves raw group assertions (from SAML/OIDC claims) into AegisOS RBAC roles.
   */
  public mapGroupsToRoles(rawGroups: string[]): string[] {
    const assignedRoles = new Set<string>();

    for (const groupClaim of rawGroups) {
      const trimmedClaim = groupClaim.trim();

      for (const rule of this.rules) {
        if (rule.pattern.startsWith("/") && rule.pattern.endsWith("/i")) {
          // Regex matching
          const regexStr = rule.pattern.slice(1, -2);
          const regex = new RegExp(regexStr, "i");
          if (regex.test(trimmedClaim)) {
            rule.roles.forEach(role => assignedRoles.add(role));
          }
        } else if (trimmedClaim.toLowerCase() === rule.pattern.toLowerCase()) {
          // Exact string matching (case-insensitive)
          rule.roles.forEach(role => assignedRoles.add(role));
        } else if (trimmedClaim.includes(rule.pattern)) {
          // Substring matching for full Distinguished Names (DN)
          rule.roles.forEach(role => assignedRoles.add(role));
        }
      }
    }

    // Default zero-touch fallback if authenticated but no explicit group matches
    if (assignedRoles.size === 0) {
      assignedRoles.add("User");
    }

    return Array.from(assignedRoles);
  }
}

export const groupClaimRoleMapper = new GroupClaimRoleMapper();
