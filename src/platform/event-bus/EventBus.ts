// ============================================================================
// Event Bus — Browser-compatible, strongly-typed publish/subscribe
// ============================================================================
// No Node.js dependencies. Pure browser runtime.
// Future: WebSocket bridge, SSE bridge, MCP event bridge.
// ============================================================================

import type {
  PlatformEventMap,
  EventPriority,
  EventHistoryEntry,
  EventSubscription,
  EventSubscriptionOptions,
} from './types';

type Handler<T = unknown> = (payload: T) => void | Promise<void>;

interface InternalSubscription {
  id: string;
  event: string;
  handler: Handler;
  priority: EventPriority;
  once: boolean;
}

const HISTORY_CAP = 500;
let subCounter = 0;

class EventBusImpl {
  private subscriptions: Map<string, InternalSubscription[]> = new Map();
  private history: EventHistoryEntry[] = [];

  // ---- Publish ----

  publish<K extends keyof PlatformEventMap>(
    event: K & string,
    payload: PlatformEventMap[K],
    priority: EventPriority = 'normal',
  ): void {
    // Record history
    const entry: EventHistoryEntry = { event, payload, timestamp: Date.now(), priority };
    this.history.push(entry);
    if (this.history.length > HISTORY_CAP) {
      this.history = this.history.slice(-HISTORY_CAP);
    }

    // Dispatch to subscribers
    const subs = this.subscriptions.get(event);
    const wildcardSubs = this.subscriptions.get('*');
    
    // Sort and dispatch to wildcard subscribers
    if (wildcardSubs && wildcardSubs.length > 0) {
      for (const sub of wildcardSubs) {
        try {
          sub.handler({ id: `evt-${Math.random().toString(36).slice(2, 9)}`, name: event, payload, priority, timestamp: new Date(entry.timestamp).toISOString() });
        } catch (err) {
          console.error(`[EventBus] Wildcard handler error for "${event}":`, err);
        }
      }
    }

    if (!subs || subs.length === 0) return;

    // Sort by priority
    const priorityWeight: Record<EventPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    const sorted = [...subs].sort((a, b) => priorityWeight[a.priority] - priorityWeight[b.priority]);

    const toRemove: string[] = [];
    for (const sub of sorted) {
      try {
        sub.handler(payload);
      } catch (err) {
        console.error(`[EventBus] Handler error for "${event}" (sub ${sub.id}):`, err);
      }
      if (sub.once) toRemove.push(sub.id);
    }

    // Clean up once-only subscriptions
    if (toRemove.length > 0) {
      this.subscriptions.set(
        event,
        subs.filter((s) => !toRemove.includes(s.id)),
      );
    }
  }

  // ---- Subscribe ----

  subscribe<K extends keyof PlatformEventMap>(
    event: K & string,
    handler: Handler<PlatformEventMap[K]>,
    options?: EventSubscriptionOptions,
  ): EventSubscription {
    const id = `sub-${++subCounter}`;
    const sub: InternalSubscription = {
      id,
      event,
      handler: handler as Handler,
      priority: options?.priority ?? 'normal',
      once: options?.once ?? false,
    };

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    this.subscriptions.get(event)!.push(sub);

    const unsubscribe = () => this.unsubscribe(id);
    return { id, event, priority: sub.priority, unsubscribe };
  }

  // ---- Unsubscribe ----

  unsubscribe(subscriptionId: string): void {
    for (const [event, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length !== subs.length) {
        this.subscriptions.set(event, filtered);
        return;
      }
    }
  }

  // ---- Replay ----

  replay<K extends keyof PlatformEventMap>(event: K & string, count = 10): EventHistoryEntry<PlatformEventMap[K]>[] {
    return this.history
      .filter((e) => e.event === event)
      .slice(-count) as EventHistoryEntry<PlatformEventMap[K]>[];
  }

  // ---- History ----

  getHistory(event?: string): EventHistoryEntry[] {
    if (event) return this.history.filter((e) => e.event === event);
    return [...this.history];
  }

  // ---- Clear ----

  clear(): void {
    this.subscriptions.clear();
    this.history = [];
  }
}

export const EventBus = new EventBusImpl();
