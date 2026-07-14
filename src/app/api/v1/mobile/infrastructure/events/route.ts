// src/app/api/v1/mobile/infrastructure/events/route.ts
// REST endpoint for mobile client querying system event audits and timeline history

import { NextResponse } from "next/server";
import { eventBus } from "@/infrastructure/events/event-bus";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auditTrail = eventBus.getAuditTrail();

    // Map and slice the latest 50 logs for presentation on the mobile timeline
    const events = auditTrail.slice(-50).map((event) => ({
      id: event.id,
      name: event.name,
      timestamp: event.timestamp,
      priority: event.priority || "normal",
      correlationId: event.correlationId,
      traceId: event.traceId,
      payload: event.payload
    })).reverse(); // Show newest events first

    return NextResponse.json(events);
  } catch (err: any) {
    console.error("[MobileEventsAPIError]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
