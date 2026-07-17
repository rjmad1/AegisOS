// ============================================================================
// Event Platform — Typed, Validated, Retrying Event Bus with Tracing
// ============================================================================

import { z } from 'zod';
import { hardenedEventBus, HardenedEvent } from '../../infrastructure/events/event-bus';
import { RuntimeContext } from '../context/RuntimeContext';
import prisma from '../../infrastructure/db/prisma';

// Zod schema for basic event verification
export const EventSchema = z.object({
  name: z.string().min(1),
  source: z.string().min(1),
  version: z.string().default('v1'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('normal' as any),
  securityClassification: z.enum(['public', 'internal', 'restricted']).default('internal'),
  retentionPolicy: z.enum(['temp', 'session', 'archive']).default('temp'),
  payload: z.any().refine(val => val !== undefined && val !== null, {
    message: "Payload cannot be null or undefined"
  }),
});

export interface EventRetryPolicy {
  maxRetries: number;
  backoffType: 'constant' | 'exponential';
  delayMs: number;
}

export class EventPlatform {
  private static instance: EventPlatform | null = null;
  private retryPolicies: Map<string, EventRetryPolicy> = new Map();

  private processedEventIds: Set<string> = new Set();
  private maxDuplicateCacheSize = 1000;

  private constructor() {
    // Set default retry policies for critical events
    this.registerRetryPolicy('platform:error', {
      maxRetries: 3,
      backoffType: 'exponential',
      delayMs: 1000,
    });
  }

  public static getInstance(): EventPlatform {
    if (!EventPlatform.instance) {
      EventPlatform.instance = new EventPlatform();
    }
    return EventPlatform.instance;
  }

  /**
   * Replays events of a specific type from a starting timestamp.
   */
  public async replayEvents(eventName: string, handler: (event: any) => void | Promise<void>, startFromTimestamp: number): Promise<number> {
    try {
      const records = await prisma.auditEvent.findMany({
        where: {
          eventType: eventName,
          timestamp: {
            gte: new Date(startFromTimestamp).toISOString()
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      let count = 0;
      for (const record of records) {
        try {
          const details = JSON.parse(record.details || '{}');
          const replayedEvent = {
            name: record.eventType,
            source: details.source || 'replayed',
            timestamp: new Date(record.timestamp).getTime(),
            correlationId: details.correlationId,
            traceId: details.traceId,
            payload: details.payload
          };
          await handler(replayedEvent);
          count++;
        } catch {}
      }
      return count;
    } catch {
      return 0;
    }
  }

  /**
   * Register a retry policy for a specific event type.
   */
  public registerRetryPolicy(eventName: string, policy: EventRetryPolicy): void {
    this.retryPolicies.set(eventName, policy);
  }

  /**
   * Publish an event. Automatically injects correlationId and traceId.
   */
  public async publish(event: {
    name: string;
    source: string;
    version?: string;
    priority?: HardenedEvent['priority'];
    securityClassification?: HardenedEvent['securityClassification'];
    retentionPolicy?: HardenedEvent['retentionPolicy'];
    payload: any;
  }): Promise<void> {
    // 1. Validate Schema
    const parsed = EventSchema.safeParse(event);
    if (!parsed.success) {
      console.error(`[EventPlatform] Event schema validation failed for "${event.name}":`, parsed.error.format());
      await this.routeToDLQ({
        ...event,
        id: `failed-evt-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        correlationId: RuntimeContext.getCorrelationId(),
        traceId: RuntimeContext.getTraceId(),
        version: event.version || 'v1',
        priority: event.priority || 'medium',
        securityClassification: event.securityClassification || 'internal',
        retentionPolicy: event.retentionPolicy || 'temp',
      } as HardenedEvent, `Schema validation failure: ${parsed.error.message}`);
      return;
    }
    // 2. Inject Correlation and Trace IDs from context
    const correlationId = RuntimeContext.getCorrelationId();
    const traceId = RuntimeContext.getTraceId();

    const dedupeKey = `${event.name}:${correlationId && !correlationId.startsWith('corr-') ? correlationId : ''}:${JSON.stringify(event.payload)}`;
    if (this.processedEventIds.has(dedupeKey)) {
      console.log(`[EventPlatform] Event duplicate suppressed: ${event.name}`);
      return;
    }
    this.processedEventIds.add(dedupeKey);
    if (this.processedEventIds.size > this.maxDuplicateCacheSize) {
      const firstKey = this.processedEventIds.values().next().value;
      if (firstKey) this.processedEventIds.delete(firstKey);
    }

    const hardenedEvent: Partial<HardenedEvent> & { name: string; source: string; version: string; priority: HardenedEvent["priority"]; securityClassification: HardenedEvent["securityClassification"]; retentionPolicy: HardenedEvent["retentionPolicy"]; payload: any } = {
      name: event.name,
      source: event.source,
      version: event.version || 'v1',
      priority: event.priority || 'medium',
      securityClassification: event.securityClassification || 'internal',
      retentionPolicy: event.retentionPolicy || 'temp',
      payload: event.payload,
      correlationId,
      traceId,
    };

    // 3. Delegate to hardenedEventBus and save to DB Audit Event
    await hardenedEventBus.publish(hardenedEvent);
    
    // Save to relational SQLite database
    try {
      await prisma.auditEvent.create({
        data: {
          timestamp: new Date().toISOString(),
          eventType: event.name,
          userId: RuntimeContext.getUserId() || null,
          userEmail: null,
          ipAddress: null,
          details: JSON.stringify({
            source: event.source,
            correlationId,
            traceId,
            payload: event.payload
          })
        }
      });
    } catch (err: any) {
      console.warn('[EventPlatform] Failed to save AuditEvent to DB:', err.message);
    }
  }

  /**
   * Subscribe to an event with retry logic and error propagation.
   */
  public subscribe(
    eventName: string,
    handler: (event: HardenedEvent) => void | Promise<void>
  ): string {
    const policy = this.retryPolicies.get(eventName) || {
      maxRetries: 2,
      backoffType: 'constant',
      delayMs: 500,
    };

    // Wrap handler to execute within context of the event and implement custom retries
    const wrappedHandler = async (evt: HardenedEvent) => {
      await RuntimeContext.runWith(
        { correlationId: evt.correlationId, traceId: evt.traceId },
        async () => {
          let attempt = 0;
          while (attempt <= policy.maxRetries) {
            try {
              await handler(evt);
              return; // Success
            } catch (err: any) {
              attempt++;
              console.warn(`[EventPlatform] Subscriber attempt ${attempt}/${policy.maxRetries + 1} failed for "${eventName}":`, err.message);
              
              if (attempt > policy.maxRetries) {
                console.error(`[EventPlatform] Maximum retries exceeded for event handler. Routing to DLQ.`);
                await this.routeToDLQ(evt, `Subscriber execution failed after ${attempt} attempts. Error: ${err.message}`);
                throw err;
              }

              // Compute backoff delay
              const delay = policy.backoffType === 'exponential'
                ? policy.delayMs * Math.pow(2, attempt - 1)
                : policy.delayMs;

              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
      );
    };

    // Subscribe to backend bus
    return hardenedEventBus.subscribe(eventName, wrappedHandler, policy.maxRetries);
  }

  /**
   * Unsubscribe from event.
   */
  public unsubscribe(subId: string): void {
    hardenedEventBus.unsubscribe(subId);
  }

  /**
   * Retrieve DLQ logs.
   */
  public getDLQ(): any[] {
    return hardenedEventBus.getDLQ();
  }

  /**
   * Private routing to DLQ.
   */
  private async routeToDLQ(event: HardenedEvent, reason: string): Promise<void> {
    try {
      // In addition to file DLQ, we log it as an unhealthy health warning
      console.warn(`[EventPlatform:DLQ] Routed event "${event.name}" to DLQ. Reason: ${reason}`);
      
      // Save DLQ event to database AuditEvent table under a special type
      await prisma.auditEvent.create({
        data: {
          timestamp: new Date().toISOString(),
          eventType: 'DEAD_LETTER_EVENT',
          details: JSON.stringify({
            originalEvent: event,
            reason,
            failedAt: new Date().toISOString()
          })
        }
      });
    } catch (err: any) {
      console.error('[EventPlatform] Failed to route to DB DLQ:', err.message);
    }
  }
}

export const eventPlatform = EventPlatform.getInstance();
export default eventPlatform;
