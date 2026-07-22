import { NextRequest, NextResponse } from 'next/server';
import mobileAuthService from '@/platform/auth/mobile-auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, challenge, signature } = body;

    if (!deviceId || !challenge || !signature) {
      return NextResponse.json({
        code: 'ERR_INVALID_PARAMETERS',
        message: 'deviceId, challenge, and signature are required.'
      }, { status: 400 });
    }

    const tokens = await mobileAuthService.establishSession(deviceId, challenge, signature);

    return NextResponse.json({
      accessToken: tokens.jwt,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(tokens.expiresAt / 1000)
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_SESSION_FAILED',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
