// src/app/api/v1/mobile/auth/session/route.ts
// Establishes new mobile sessions or rotates existing refresh tokens

import { NextResponse } from "next/server";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { deviceId, challenge, signature, refreshToken } = payload;

    if (!deviceId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "deviceId is required" },
        { status: 400 }
      );
    }

    // Branch A: Establish new session via cryptographic signature check
    if (challenge && signature) {
      const tokens = await mobileAuthService.establishSession(deviceId, challenge, signature);
      return NextResponse.json(tokens, { status: 201 });
    }

    // Branch B: Refresh active session via Refresh Token Rotation (RTR)
    if (refreshToken) {
      const tokens = await mobileAuthService.refreshSession(deviceId, refreshToken);
      return NextResponse.json(tokens, { status: 200 });
    }

    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Provide either (challenge + signature) or refreshToken" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Session API Post Error]", error);
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: error.message },
      { status: 401 }
    );
  }
}
