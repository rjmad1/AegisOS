// src/app/api/v1/mobile/auth/devices/route.ts
// Lists registered mobile devices. Gated by Administrator session authentication.

import { NextResponse } from "next/server";
import sessionService from "@/platform/auth/session.service";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

export async function GET() {
  try {
    // 1. Authorize session & admin role
    const session = await sessionService.getSession();
    if (!session || (session.role !== "Administrator" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only administrators can view devices" },
        { status: 403 }
      );
    }

    const devices = await mobileAuthService.listDevices();
    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("[Devices API Get Error]", error);
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR", message: error.message },
      { status: 500 }
    );
  }
}
