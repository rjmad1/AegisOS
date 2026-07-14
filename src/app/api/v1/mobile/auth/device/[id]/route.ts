// src/app/api/v1/mobile/auth/device/[id]/route.ts
// Handles device revocation by ID. Gated by administrator credentials.

import { NextResponse } from "next/server";
import sessionService from "@/platform/auth/session.service";
import mobileAuthService from "@/platform/auth/mobile-auth.service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authorize session & admin role
    const session = await sessionService.getSession();
    if (!session || (session.role !== "Administrator" && session.role !== "admin")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only administrators can revoke devices" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "BAD_REQUEST", message: "Device ID parameter is required" },
        { status: 400 }
      );
    }

    await mobileAuthService.revokeDevice(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Device Revocation API Delete Error]", error);
    return NextResponse.json(
      { error: "BAD_REQUEST", message: error.message },
      { status: 400 }
    );
  }
}
