import { NextRequest, NextResponse } from 'next/server';

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

    // Simulate validation of the one-time pairing token (e.g., checks database registry)
    const isValidToken = pairingToken.startsWith('PAIR-');
    if (!isValidToken) {
      return NextResponse.json({
        code: 'ERR_PAIR_INVALID',
        message: 'The pairing token is invalid or has expired.'
      }, { status: 403 });
    }

    // Scaffold Mock Client Certificate signed by the Workstation CA
    const mockClientCert = `-----BEGIN CERTIFICATE-----\nMIIBtzCCAVWgAwIBAgIIdeviceCertFor${deviceId.substring(0, 8)}...\n-----END CERTIFICATE-----`;
    const mockCaCert = `-----BEGIN CERTIFICATE-----\nMIIBszCCATqgAwIBAgIIworkstationCaCert...\n-----END CERTIFICATE-----`;

    return NextResponse.json({
      clientCertificate: mockClientCert,
      caCertificate: mockCaCert
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
