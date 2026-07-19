import { IEventTransport, EventContract, EventPriority, DeliveryPolicy } from '../types';

export class InMemoryTransport implements IEventTransport {
  private handlers = new Map<string, Set<(event: EventContract) => Promise<void>>>();

  public async connect(): Promise<void> {}

  public async disconnect(): Promise<void> {
    this.handlers.clear();
  }

  public async publish<T>(event: EventContract<T>, priority?: EventPriority, policy?: DeliveryPolicy): Promise<void> {
    const categoryHandlers = this.handlers.get(event.category);
    if (!categoryHandlers) return;

    const promises = Array.from(categoryHandlers).map(handler => 
      handler(event).catch(err => {
        console.error(`[InMemoryTransport] Error handling event ${event.id}:`, err);
      })
    );

    if (policy === DeliveryPolicy.FIRE_AND_FORGET) {
      return;
    }

    await Promise.allSettled(promises);
  }

  public subscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void {
    if (!this.handlers.has(category)) {
      this.handlers.set(category, new Set());
    }
    this.handlers.get(category)!.add(handler as any);
  }

  public unsubscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void {
    const categoryHandlers = this.handlers.get(category);
    if (categoryHandlers) {
      categoryHandlers.delete(handler as any);
    }
  }
}
