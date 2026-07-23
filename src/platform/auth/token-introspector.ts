// src/platform/auth/token-introspector.ts
// Decoupled, zero-loopback in-memory token introspection engine.

import { jwtVerify } from "jose";
import prisma from "@/infrastructure/db/prisma";

const authSecret = process.env.AUTH_SECRET || process.env.OPS_JWT_SECRET;
const key = authSecret ? new TextEncoder().encode(authSecret) : null;

export interface IntrospectParams {
  token: string;
  clientIp?: string;
  requiredPermission?: string | null;
}

export interface IntrospectResult {
  active: boolean;
  authorized?: boolean;
  username?: string;
  email?: string;
  role?: string;
  permissions?: string[];
  reason?: string;
  error?: string;
}

const rolePermissionsMap: Record<string, string[]> = {
  "Super Admin": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"],
  "Admin": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"],
  "Manager": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders"],
  "Developer": ["ViewArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewHealth"],
  "Tester": ["ViewRuntime", "ViewInfrastructure", "ViewModels", "ViewHealth", "ViewProviders"],
  "Support": ["ViewHealth", "ViewLogs", "ViewSettings", "ViewProviders"],
  "Standard User": ["ViewArtifacts", "ViewConversations", "ViewModels"],
  "Read Only": ["ViewHealth", "ViewRuntime"],

  // Compatibility aliases
  "Administrator": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"],
  "Operator": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders"],
  "Viewer": ["ViewArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders"],
  "Auditor": ["ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders"],
  "admin": ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"]
};

export async function introspectToken(params: IntrospectParams): Promise<IntrospectResult> {
  const { token, clientIp, requiredPermission } = params;

  if (!token) {
    return { active: false, error: "Missing token" };
  }

  if (!key) {
    return { active: false, error: "Server missing AUTH_SECRET and OPS_JWT_SECRET" };
  }

  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
    const now = Math.floor(Date.now() / 1000);
    const expires = (payload.exp as number) || 0;

    if (expires && now > expires) {
      return { active: false, reason: "Token expired" };
    }

    let userRole = (payload.role as string) || "Administrator";
    let username = (payload.username as string) || "admin";
    let email = (payload.email as string) || "admin@ai-ops.local";
    let allowedNetworks: string[] = [];
    let permissions: string[] = [];

    // 1. Verify session state in database if sessionId exists
    if (payload.sessionId) {
      try {
        const dbSession = await prisma.session.findUnique({
          where: { id: payload.sessionId as string }
        });
        if (!dbSession) {
          return { active: false, reason: "Session database record not found" };
        }
        // Update last active in background
        prisma.session.update({
          where: { id: payload.sessionId as string },
          data: { lastActive: BigInt(now) }
        }).catch(() => {});
        userRole = dbSession.role;
      } catch (err: any) {
        // Fallback gracefully if session DB check fails during bootstrap
      }
    }

    // 2. Fetch User registry metadata from DB
    try {
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: (payload.userId as string) || "" },
            { email: email },
            { displayName: username }
          ],
          deletedAt: null
        }
      });

      if (dbUser) {
        if (dbUser.status !== "Enabled") {
          return { active: false, reason: "User status is disabled" };
        }
        userRole = dbUser.role;
        username = dbUser.displayName;
        email = dbUser.email;
        try {
          allowedNetworks = JSON.parse(dbUser.allowedNetworks || "[]");
          permissions = JSON.parse(dbUser.permissions || "[]");
        } catch {}
      } else {
        // Fallback for bootstrap admin credentials
        if (username === process.env.OPS_ADMIN_USERNAME || userRole === "Administrator" || userRole === "admin") {
          userRole = "Administrator";
          permissions = ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"];
        }
      }
    } catch (err: any) {
      // Fallback for bootstrap admin credentials if DB is initializing
      if (username === process.env.OPS_ADMIN_USERNAME || userRole === "Administrator" || userRole === "admin") {
        userRole = "Administrator";
        permissions = ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"];
      }
    }

    // 3. Network Boundary check (IP validation)
    if (clientIp && allowedNetworks.length > 0) {
      const ipMatched = allowedNetworks.some(net => {
        if (net === "*") return true;
        return clientIp === net || clientIp.startsWith(net.replace("*", ""));
      });
      if (!ipMatched) {
        return { active: false, reason: `IP address ${clientIp} not in allowed networks` };
      }
    }

    // 4. Role Permissions evaluation
    const resolvedPermissions = Array.from(new Set([
      ...permissions,
      ...(rolePermissionsMap[userRole] || rolePermissionsMap["Administrator"] || [])
    ]));

    if (requiredPermission && !resolvedPermissions.includes(requiredPermission)) {
      return {
        active: true,
        authorized: false,
        reason: `Required permission "${requiredPermission}" not granted`
      };
    }

    return {
      active: true,
      authorized: true,
      username,
      email,
      role: userRole,
      permissions: resolvedPermissions
    };
  } catch (e: any) {
    return { active: false, reason: "Invalid JWT token signature", error: e.message };
  }
}
