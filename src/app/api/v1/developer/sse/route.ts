// src/app/api/v1/developer/sse/route.ts

import { NextRequest } from 'next/server';
import { eventBus } from '@/infrastructure/events/event-bus';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const subIds: string[] = [];

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial connect event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ name: 'connected', timestamp: new Date().toISOString() })}\n\n`)
      );

      // 2. Setup heartbeat interval
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ name: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`)
          );
        } catch (e) {
          clearInterval(heartbeat);
        }
      }, 10000);

      // 3. Subscribe to developer-specific events
      const devEvents = [
        'ExtensionRegistered', 'ExtensionUnregistered', 'ExtensionPointDeclared',
        'PluginLoaded', 'PluginUnloaded',
        'MarketplaceItemPublished', 'MarketplaceItemInstalled', 'MarketplaceReviewSubmitted',
        'CertificationStarted', 'CertificationCompleted',
        'UsageMetricRecorded', 'LicenseEntitlementUpdated'
      ];

      devEvents.forEach((eventName) => {
        const subId = eventBus.subscribe(eventName, (event) => {
          try {
            const dataStr = `data: ${JSON.stringify({
              id: event.id,
              name: event.name,
              timestamp: event.timestamp,
              payload: event.payload
            })}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          } catch (err) {
            console.error(`[SSE:Developer] Failed to write event "${eventName}" to stream:`, err);
          }
        });
        subIds.push(subId);
      });

      // 4. Handle connection abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        subIds.forEach((subId) => {
          eventBus.unsubscribe(subId);
        });
        try {
          controller.close();
        } catch {}
        console.log('[SSE:Developer] Developer SSE stream closed.');
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
