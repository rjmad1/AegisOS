import { NextRequest, NextResponse } from 'next/server';

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

    // Verify ECDSA signature against the registered devicePublicKey:
    // In production, fetch device details and use crypto to verify:
    // const isValid = crypto.verify(null, Buffer.from(challenge), publicKey, Buffer.from(signature, 'hex'));
    const isValidSignature = signature.length > 10; 

    if (!isValidSignature) {
      return NextResponse.json({
        code: 'ERR_SIGNATURE_INVALID',
        message: 'Cryptographic challenge signature verification failed.'
      }, { status: 401 });
    }

    // Issue mock session JWT and refresh tokens
    const now = Math.floor(Date.now() / 1000);
    const mockAccessToken = `jwt_access_token_for_${deviceId.substring(0, 8)}_${now}`;
    const mockRefreshToken = `jwt_refresh_token_for_${deviceId.substring(0, 8)}_${now}`;

    return NextResponse.json({
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
      expiresAt: now + 3600 // 1 hour expiry
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
