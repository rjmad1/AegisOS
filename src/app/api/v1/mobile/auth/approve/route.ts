// src/app/api/v1/mobile/auth/approve/route.ts
// Administrative route to approve pending mobile devices

import { NextResponse } from "next/server";
import sessionService from "@/platform/auth/session.service";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

export async function POST(request: Request) {
  try {
    // 1. Authorize session & admin role
    const session = await sessionService.getSession();
    if (!session || (session.role !== "Administrator" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only administrators can approve devices" },
        { status: 403 }
      );
    }

    const { deviceId } = await request.json();
    if (!deviceId) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "deviceId is required" },
        { status: 400 }
      );
    }

    await mobileAuthService.approveDevice(deviceId);

    return NextResponse.json({
      success: true,
      status: "APPROVED",
    });
  } catch (error: any) {
    console.error("[Approve API Post Error]", error);
    return NextResponse.json(
      { error: "BAD_REQUEST", message: error.message },
      { status: 400 }
    );
  }
}
