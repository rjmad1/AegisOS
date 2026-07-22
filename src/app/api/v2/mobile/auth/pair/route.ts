import { NextRequest, NextResponse } from 'next/server';
import mobileAuthService from '@/platform/auth/mobile-auth.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pairingToken, deviceId, devicePublicKey, deviceName } = body;

    // Validate request parameters
    if (!pairingToken || !deviceId || !devicePublicKey) {
      return NextResponse.json({
        code: 'ERR_INVALID_PARAMETERS',
        message: 'pairingToken, deviceId, and devicePublicKey are required.'
      }, { status: 400 });
    }

    const result = await mobileAuthService.pairDevice({
      pairingToken,
      publicKey: devicePublicKey,
      deviceName: deviceName || `Device-${deviceId.substring(0, 8)}`,
      metadata: { deviceId }
    });

    return NextResponse.json({
      success: true,
      deviceId: result.deviceId,
      status: result.status,
    }, {
      headers: {
        'Cache-Control': 'no-store'
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_PAIR_FAILED',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
