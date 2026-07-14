// src/app/api/v1/mobile/auth/logout/route.ts
// Handles mobile device session logout and refresh token invalidation

import { NextResponse } from "next/server";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

export async function POST(request: Request) {
  try {
    const { deviceId, refreshToken } = await request.json();

    if (!deviceId || !refreshToken) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "deviceId and refreshToken are required" },
        { status: 400 }
      );
    }

    await mobileAuthService.logout(deviceId, refreshToken);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Logout API Post Error]", error);
    return NextResponse.json(
      { error: "BAD_REQUEST", message: error.message },
      { status: 400 }
    );
  }
}
