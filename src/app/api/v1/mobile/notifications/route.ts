import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/infrastructure/sdk/platform-sdk";

export async function GET(req: NextRequest) {
  try {
    const events = await prisma.auditEvent.findMany({
      orderBy: { timestamp: "desc" },
      take: 20,
    });

    const notifications = events.map(e => ({
      id: e.id,
      type: e.eventType.toLowerCase().includes("fail") || e.eventType.toLowerCase().includes("alert") ? "error" : "info",
      title: e.eventType,
      message: e.details,
      timestamp: new Date(e.timestamp).getTime(),
      read: false,
      source: "audit-logger",
    }));

    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
