// src/platform/auth/session.service.ts
// Relational SQLite Persistence for Active Sessions and Audits using Prisma ORM

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "../../infrastructure/db/prisma";

const SESSION_COOKIE_NAME = "auth_session";
let cachedKey: Uint8Array | null = null;

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const authSecret = process.env.AUTH_SECRET;

  const INSECURE_SECRETS = new Set([
    "super-secret-random-hash-key-for-console-jwt-signing-2026",
    "fallback_secret_must_change_in_production_extremely_long",
    "build-time-placeholder-not-a-real-secret-minimum-length-required-for-compilation",
    "",
  ]);

  if (!authSecret || INSECURE_SECRETS.has(authSecret)) {
    throw new Error("FATAL: AUTH_SECRET environment variable is missing or insecure!");
  }
  cachedKey = new TextEncoder().encode(authSecret);
  return cachedKey;
}

export interface SessionData {
  id: string;
  userId: string;
  role: string;
  createdAt: number;
  lastActive: number;
  organizationId?: string;
  tenantId?: string;
}

export class SessionService {
  public async createSession(userId: string, role: string, organizationId?: string, tenantId?: string): Promise<void> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // Persist session to SQLite
    await prisma.session.create({
      data: {
        id: sessionId,
        userId,
        role,
        createdAt: now,
        lastActive: now,
        organizationId: organizationId || null,
        tenantId: tenantId || null,
      },
    });

    const token = await new SignJWT({ sessionId, userId, role, organizationId, tenantId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(getKey());

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60, // 8 hours
      path: "/",
    });
  }

  public async getSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    try {
      const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
      const sessionId = payload.sessionId as string;

      // Validate session against database record
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) return null;

      const now = Math.floor(Date.now() / 1000);

      // Check idle timeout (2 hours)
      const IDLE_TIMEOUT = 2 * 60 * 60; // 2 hours in seconds
      if (now - session.lastActive > IDLE_TIMEOUT) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Check absolute timeout (12 hours)
      const ABSOLUTE_TIMEOUT = 12 * 60 * 60; // 12 hours in seconds
      if (now - session.createdAt > ABSOLUTE_TIMEOUT) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Token Rotation checking: if OIDC oauth token exists, verify rotation
      const tokenAge = now - session.lastActive;
      const ROTATION_THRESHOLD = 55 * 60; // 55 minutes in seconds
      if (tokenAge > ROTATION_THRESHOLD && process.env.AUTH_PROVIDER !== 'ldap') {
        console.log(`[SessionService] Token age exceeded threshold. Triggering OIDC token rotation check.`);
        const rotated = await this.rotateOidcTokens(session.userId);
        if (!rotated) {
          console.warn(`[SessionService] Token rotation failed. Invalidating session.`);
          await this.invalidateSession(sessionId);
          return null;
        }
      }

      // Sliding expiration: update last active timestamp in SQLite
      await prisma.session.update({
        where: { id: sessionId },
        data: { lastActive: now },
      });

      return {
        id: session.id,
        userId: session.userId,
        role: session.role,
        createdAt: session.createdAt * 1000,
        lastActive: now * 1000,
        organizationId: session.organizationId || undefined,
        tenantId: session.tenantId || undefined,
      };
    } catch {
      return null;
    }
  }

  /**
   * OIDC Token Rotation — NOT YET IMPLEMENTED
   *
   * This is a no-op stub that always returns true. In production with an OIDC
   * provider, this should call oauth2.authorizationCodeGrantRequest or
   * a similar refresh_token flow to obtain a new access token.
   *
   * Tracked in: ROADMAP.md → v1.2.0 (Authentication & Identity)
   * See also: docs/SECURITY_ARCHITECTURE.md → Known Limitations
   *
   * @todo Implement real OIDC token rotation when auth provider is configured
   */
  private async rotateOidcTokens(userId: string): Promise<boolean> {
    // TODO(auth): Implement real OIDC refresh token exchange — see ROADMAP.md v1.2.0
    console.log(`[SessionService] OIDC token rotation not implemented. Skipping for user: ${userId}`);
    return true;
  }

  public async invalidateSession(sessionId: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
    } catch {}

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }

  public async logoutEverywhere(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: { userId },
    });

    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

export const sessionService = new SessionService();
export default sessionService;
