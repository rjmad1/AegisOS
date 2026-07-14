// src/app/api/v1/mobile/auth/pair/route.ts
// Handles generation of pairing challenges and mobile device registration requests

import { NextResponse } from "next/server";
import os from "os";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

/**
 * GET: Generates a new pairing challenge (QR token + manual code + host IP/Port details)
 * Used by the Web Console Admin settings UI.
 */
export async function GET() {
  try {
    const challenge = await mobileAuthService.createPairingChallenge();
    
    // Resolve dynamic host IPs (LAN and Tailscale)
    const hostIpAddresses: string[] = [];
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      const iface = interfaces[name];
      if (iface) {
        for (const alias of iface) {
          if (alias.family === "IPv4" && !alias.internal) {
            hostIpAddresses.push(alias.address);
          }
        }
      }
    }
    
    // If no external IP, fallback to localhost
    if (hostIpAddresses.length === 0) {
      hostIpAddresses.push("127.0.0.1");
    }

    const hostPort = process.env.PORT || "3000";
    const securePort = "8443"; // Caddy HTTPS reverse-proxy port

    return NextResponse.json({
      token: challenge.token,
      code: challenge.code,
      expiresAt: challenge.expiresAt,
      endpoints: hostIpAddresses.map(ip => ({
        ip,
        httpUrl: `http://${ip}:${hostPort}/api/v1`,
        httpsUrl: `https://${ip}:${securePort}/api/v1`
      })),
      hostName: os.hostname(),
    });
  } catch (error: any) {
    console.error("[Pair API Get Error]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Handles mobile client pairing requests
 * Mobile sends scanned/entered token/code, ECDSA public key, device name, and metadata.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { pairingToken, pairingCode, publicKey, deviceName, metadata, pushToken } = payload;

    if (!publicKey || !deviceName) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "publicKey and deviceName are required fields" },
        { status: 400 }
      );
    }

    if (!pairingToken && !pairingCode) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Either pairingToken or pairingCode is required" },
        { status: 400 }
      );
    }

    const result = await mobileAuthService.pairDevice({
      pairingToken,
      pairingCode,
      publicKey,
      deviceName,
      metadata: metadata || {},
      pushToken,
    });

    return NextResponse.json({
      success: true,
      deviceId: result.deviceId,
      status: result.status,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Pair API Post Error]", error);
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: error.message },
      { status: 401 }
    );
  }
}
