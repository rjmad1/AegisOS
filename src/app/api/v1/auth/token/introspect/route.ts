import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/infrastructure/db/prisma";

const authSecret = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(authSecret);

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, clientIp, requiredPermission } = body;

    if (!token) {
      return NextResponse.json({ active: false, error: "Missing token" }, { status: 400 });
    }

    if (!authSecret) {
      return NextResponse.json({ active: false, error: "Server misconfiguration" }, { status: 500 });
    }

    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
      const now = Date.now();
      const expires = (payload.expires as number) || 0;

      if (expires && now > expires) {
        return NextResponse.json({ active: false, reason: "Token expired" });
      }

      let userRole = payload.role as string;
      let username = payload.username as string || "admin";
      let email = payload.email as string || "admin@ai-ops.local";
      let allowedNetworks: string[] = [];
      let permissions: string[] = [];

      // 1. Verify session state in SQLite database if sessionId exists
      if (payload.sessionId) {
        const dbSession = await prisma.session.findUnique({
          where: { id: payload.sessionId as string }
        });
        if (!dbSession) {
          return NextResponse.json({ active: false, reason: "Session database record not found" });
        }
        // Update last active
        await prisma.session.update({
          where: { id: payload.sessionId as string },
          data: { lastActive: now }
        });
        userRole = dbSession.role;
      }

      // 2. Fetch User registry metadata from SQLite
      const dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: payload.userId as string },
            { email: email },
            { displayName: username }
          ],
          deletedAt: null
        }
      });

      if (dbUser) {
        if (dbUser.status !== "Enabled") {
          return NextResponse.json({ active: false, reason: "User status is disabled" });
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
        if (username === process.env.OPS_ADMIN_USERNAME) {
          userRole = "Administrator";
          permissions = ["ViewArtifacts", "DownloadArtifacts", "ViewRuntime", "ViewInfrastructure", "ViewKnowledge", "ViewModels", "ViewConversations", "ViewLogs", "ViewSettings", "ViewHealth", "ViewProviders", "Administration"];
        }
      }

      // 3. Continuous verification of Network Boundaries (IP validation)
      if (clientIp && allowedNetworks.length > 0) {
        const ipMatched = allowedNetworks.some(net => {
          if (net === "*") return true;
          // Simple subnet match or exact IP check
          return clientIp === net || clientIp.startsWith(net.replace("*", ""));
        });
        if (!ipMatched) {
          console.warn(`[Security Introspection] User ${username} access blocked from IP: ${clientIp}`);
          return NextResponse.json({ active: false, reason: `IP address ${clientIp} not in allowed networks` });
        }
      }

      // 4. Role Permissions evaluation
      // Map display roles to permission arrays
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

      const resolvedPermissions = [
        ...permissions,
        ...(rolePermissionsMap[userRole] || [])
      ];

      if (requiredPermission && !resolvedPermissions.includes(requiredPermission)) {
        return NextResponse.json({
          active: true,
          authorized: false,
          reason: `Required permission "${requiredPermission}" not granted`
        });
      }

      return NextResponse.json({
        active: true,
        authorized: true,
        username,
        email,
        role: userRole,
        permissions: resolvedPermissions,
        exp: Math.floor(expires / 1000)
      });
    } catch (e: any) {
      return NextResponse.json({ active: false, reason: "Invalid JWT token signature", error: e.message });
    }
  } catch (err: any) {
    return NextResponse.json({ active: false, error: err.message }, { status: 400 });
  }
}
