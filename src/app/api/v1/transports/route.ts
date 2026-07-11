// ============================================================================
// Operations API — GET /api/v1/transports (Real-time Transport List)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const transports = [
      {
        id: 'sse',
        name: 'Server-Sent Events',
        description: 'Standard HTTP one-way stream from server to client',
        status: 'active',
        priority: 1,
        isFallback: false,
      },
      {
        id: 'websocket',
        name: 'WebSockets',
        description: 'Bidirectional full-duplex persistent channel (Planned)',
        status: 'future',
        priority: 2,
        isFallback: false,
      },
      {
        id: 'polling',
        name: 'Incremental Polling',
        description: 'Periodic timestamp checking endpoint queries',
        status: 'fallback',
        priority: 3,
        isFallback: true,
      },
    ];

    return NextResponse.json({ transports });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
