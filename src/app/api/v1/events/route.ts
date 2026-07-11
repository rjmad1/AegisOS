// ============================================================================
// Operations API — GET /api/v1/events
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { eventBus } from '@/infrastructure/events/event-bus';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');
    const since = sinceParam ? parseInt(sinceParam, 10) : 0;

    const auditTrail = eventBus.getAuditTrail();
    let events = auditTrail.map(event => ({
      id: event.id,
      name: event.name,
      timestamp: event.timestamp,
      priority: event.priority,
      correlationId: event.correlationId,
      traceId: event.traceId,
      payload: event.payload,
    }));

    if (since > 0) {
      events = events.filter(e => new Date(e.timestamp).getTime() > since);
    }

    return NextResponse.json({ events });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
