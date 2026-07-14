import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock system diagnostics metrics aligning with the OpenAPI TelemetrySnapshot schema
    const telemetry = {
      cpuUsage: 18.5,
      memoryUsage: 54.2,
      gpuUsage: 35.0,
      vramUsage: 48.1,
      hostStatus: 'Online',
      timestamp: Math.floor(Date.now() / 1000)
    };

    return NextResponse.json(telemetry, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-RateLimit-Limit': '300',
        'X-RateLimit-Remaining': '299',
        'X-RateLimit-Reset': Math.floor((Date.now() + 60000) / 1000).toString()
      }
    });
  } catch (err: any) {
    return NextResponse.json({
      code: 'ERR_INTERNAL',
      message: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
