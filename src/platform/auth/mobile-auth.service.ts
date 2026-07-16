// src/platform/auth/mobile-auth.service.ts
// Relational SQLite Persistence and Cryptographic Validation for Mobile Devices and Sessions

import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import prisma from "../../infrastructure/db/prisma";

let cachedJwtKey: Uint8Array | null = null;

function getJwtKey(): Uint8Array {
  if (cachedJwtKey) return cachedJwtKey;
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    throw new Error("FATAL: AUTH_SECRET environment variable is missing!");
  }
  cachedJwtKey = new TextEncoder().encode(authSecret);
  return cachedJwtKey;
}

export interface MobilePairRequest {
  pairingToken?: string;
  pairingCode?: string;
  publicKey: string; // Base64 DER or PEM string
  deviceName: string;
  metadata: Record<string, any>;
  pushToken?: string;
}

export class MobileAuthService {
  /**
   * Generates a fresh pairing challenge (both QR UUID token and manual pairing code)
   */
  public async createPairingChallenge(): Promise<{ token: string; code: string; expiresAt: Date }> {
    const token = crypto.randomUUID();
    
    // Generate a beautiful, readable manual code: AEGIS-XXX-XXX where X is 0-9
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(100 + Math.random() * 900);
    const code = `AEGIS-${part1}-${part2}`;
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    await prisma.pairingChallenge.create({
      data: {
        token,
        code,
        expiresAt,
      },
    });

    return { token, code, expiresAt };
  }

  /**
   * Validates pairing challenge and creates a PENDING mobile device registry
   */
  public async pairDevice(req: MobilePairRequest): Promise<{ deviceId: string; status: string }> {
    if (!req.publicKey) {
      throw new Error("Public key is required for trust establishment");
    }

    let challenge = null;

    if (req.pairingToken) {
      challenge = await prisma.pairingChallenge.findUnique({
        where: { token: req.pairingToken },
      });
    } else if (req.pairingCode) {
      challenge = await prisma.pairingChallenge.findUnique({
        where: { code: req.pairingCode },
      });
    }

    if (!challenge) {
      throw new Error("Invalid pairing challenge token or code");
    }

    if (challenge.used) {
      throw new Error("This pairing challenge has already been used");
    }

    if (new Date() > challenge.expiresAt) {
      throw new Error("Pairing challenge has expired");
    }

    // Hash the public key to create a unique fingerprint (SHA256)
    const normalizedKey = this.normalizePublicKey(req.publicKey);
    const fingerprint = crypto.createHash("sha256").update(normalizedKey).digest("hex");

    // Invalidate the challenge
    await prisma.pairingChallenge.update({
      where: { token: challenge.token },
      data: { used: true },
    });

    // Create or update device
    const existingDevice = await prisma.mobileDevice.findUnique({
      where: { fingerprint },
    });

    if (existingDevice) {
      if (existingDevice.status === "REVOKED") {
        // Allow re-pairing of a revoked device by resetting status to PENDING
        const updated = await prisma.mobileDevice.update({
          where: { id: existingDevice.id },
          data: {
            name: req.deviceName,
            publicKey: normalizedKey,
            status: "PENDING",
            metadata: JSON.stringify(req.metadata),
            pushToken: req.pushToken || null,
            pairingToken: challenge.token,
            revokedAt: null,
            approvedAt: null,
          },
        });
        return { deviceId: updated.id, status: updated.status };
      }
      return { deviceId: existingDevice.id, status: existingDevice.status };
    }

    const newDevice = await prisma.mobileDevice.create({
      data: {
        name: req.deviceName,
        publicKey: normalizedKey,
        fingerprint,
        status: "PENDING",
        metadata: JSON.stringify(req.metadata),
        pushToken: req.pushToken || null,
        pairingToken: challenge.token,
      },
    });

    return { deviceId: newDevice.id, status: newDevice.status };
  }

  /**
   * Approves a pending mobile device registry
   */
  public async approveDevice(deviceId: string): Promise<void> {
    const device = await prisma.mobileDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error("Device not found");
    }

    if (device.status === "APPROVED") {
      return;
    }

    await prisma.mobileDevice.update({
      where: { id: deviceId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    // Log to Audit logs
    await prisma.auditEvent.create({
      data: {
        eventType: "Device Approved",
        details: `Mobile device "${device.name}" (${device.id}) approved by administrator`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Verifies client signature over challenge and establishes session
   */
  public async establishSession(
    deviceId: string,
    challenge: string,
    signature: string
  ): Promise<{ jwt: string; refreshToken: string; expiresAt: number }> {
    const device = await prisma.mobileDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error("Device not registered");
    }

    if (device.status !== "APPROVED") {
      throw new Error(`Device status is ${device.status}`);
    }

    // Verify ECDSA signature
    const isSignatureValid = this.verifySignature(
      device.publicKey,
      challenge,
      signature
    );

    if (!isSignatureValid) {
      throw new Error("Cryptographic signature validation failed");
    }

    return this.generateSessionTokens(deviceId);
  }

  /**
   * Validates refresh token and returns new session tokens using Refresh Token Rotation (RTR)
   */
  public async refreshSession(
    deviceId: string,
    refreshToken: string
  ): Promise<{ jwt: string; refreshToken: string; expiresAt: number }> {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    const record = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (!record) {
      throw new Error("Invalid refresh token");
    }

    if (record.revoked) {
      // Breach mitigation: if a token is reused, revoke ALL tokens for this device
      await prisma.mobileRefreshToken.updateMany({
        where: { deviceId },
        data: { revoked: true },
      });
      await prisma.mobileSession.updateMany({
        where: { deviceId },
        data: { status: "REVOKED" },
      });
      throw new Error("Security alert: Reused refresh token detected! All sessions revoked.");
    }

    if (new Date() > record.expiresAt) {
      throw new Error("Refresh token has expired");
    }

    if (record.deviceId !== deviceId) {
      throw new Error("Token binding mismatch");
    }

    const newTokens = await this.generateSessionTokens(deviceId);

    // Invalidate old token
    await prisma.mobileRefreshToken.update({
      where: { id: record.id },
      data: {
        revoked: true,
        replacedBy: crypto.createHash("sha256").update(newTokens.refreshToken).digest("hex"),
      },
    });

    return newTokens;
  }

  /**
   * Revokes a mobile device registry and all its sessions
   */
  public async revokeDevice(deviceId: string): Promise<void> {
    const device = await prisma.mobileDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error("Device not found");
    }

    await prisma.mobileDevice.update({
      where: { id: deviceId },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    // Invalidate tokens
    await prisma.mobileRefreshToken.updateMany({
      where: { deviceId },
      data: { revoked: true },
    });

    await prisma.mobileSession.updateMany({
      where: { deviceId },
      data: { status: "REVOKED" },
    });

    // Log to Audit logs
    await prisma.auditEvent.create({
      data: {
        eventType: "Device Revoked",
        details: `Mobile device "${device.name}" (${device.id}) revoked by administrator`,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Logs out a specific session / refresh token
   */
  public async logout(deviceId: string, refreshToken: string): Promise<void> {
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    
    await prisma.mobileRefreshToken.updateMany({
      where: { tokenHash, deviceId },
      data: { revoked: true },
    });

    // We also mark session as expired or deleted if mapped to this token
    // For simplicity, revoke active sessions
    await prisma.mobileSession.updateMany({
      where: { deviceId },
      data: { status: "EXPIRED" },
    });
  }

  /**
   * Lists all registered devices
   */
  public async listDevices() {
    return prisma.mobileDevice.findMany({
      orderBy: { createdAt: "desc" },
    });
  }

  // ---- Helper methods ----

  private normalizePublicKey(key: string): string {
    const cleaned = key.replace(/[\r\n\s]/g, "");
    if (cleaned.startsWith("-----BEGINPUBLICKEY-----")) {
      const core = cleaned
        .replace("-----BEGINPUBLICKEY-----", "")
        .replace("-----ENDPUBLICKEY-----", "");
      return `-----BEGIN PUBLIC KEY-----\n${this.chunkString(core, 64)}\n-----END PUBLIC KEY-----`;
    }
    // Assume DER base64 raw key
    return `-----BEGIN PUBLIC KEY-----\n${this.chunkString(cleaned, 64)}\n-----END PUBLIC KEY-----`;
  }

  private chunkString(str: string, len: number): string {
    const size = Math.ceil(str.length / len);
    const r = new Array(size);
    let offset = 0;
    for (let i = 0; i < size; i++) {
      r[i] = str.substring(offset, offset + len);
      offset += len;
    }
    return r.join("\n");
  }

  private verifySignature(publicKeyPem: string, challenge: string, signatureBase64: string): boolean {
    try {
      const verify = crypto.createVerify("SHA256");
      verify.update(Buffer.from(challenge, "utf-8"));
      verify.end();
      return verify.verify(publicKeyPem, Buffer.from(signatureBase64, "base64"));
    } catch (e) {
      console.error("[MobileAuthService] Cryptographic signature check failed:", e);
      return false;
    }
  }

  private async generateSessionTokens(
    deviceId: string
  ): Promise<{ jwt: string; refreshToken: string; expiresAt: number }> {
    const jti = crypto.randomUUID();
    const jwtExpiresInMinutes = 60; // 1 hour
    const jwtExpiresAt = Math.floor(Date.now() / 1000) + jwtExpiresInMinutes * 60;

    // Issue JWT
    const jwt = await new SignJWT({ deviceId, role: "operator" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setJti(jti)
      .setExpirationTime(`${jwtExpiresInMinutes}m`)
      .sign(getJwtKey());

    // Save session to SQLite
    await prisma.mobileSession.create({
      data: {
        deviceId,
        jwtJti: jti,
        expiresAt: new Date(jwtExpiresAt * 1000),
        status: "ACTIVE",
      },
    });

    // Issue Refresh Token
    const refreshToken = crypto.randomUUID();
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.mobileRefreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        deviceId,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      jwt,
      refreshToken,
      expiresAt: jwtExpiresAt * 1000,
    };
  }
}

export const mobileAuthService = new MobileAuthService();
export default mobileAuthService;
