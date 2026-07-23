import { NextResponse } from "next/server";
import { introspectToken } from "@/platform/auth/token-introspector";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, clientIp, requiredPermission } = body;

    const result = await introspectToken({ token, clientIp, requiredPermission });
    
    if (result.error && !result.active) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ active: false, error: err.message }, { status: 400 });
  }
}

