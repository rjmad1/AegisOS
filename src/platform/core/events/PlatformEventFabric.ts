import { IEventPublisher, IEventSubscriber, EventContract, EventPriority, DeliveryPolicy, IEventTransport } from './types';

export class PlatformEventFabric implements IEventPublisher, IEventSubscriber {
  private transport: IEventTransport;

  constructor(transport: IEventTransport) {
    this.transport = transport;
  }

  public async initialize(): Promise<void> {
    await this.transport.connect();
  }

  public async shutdown(): Promise<void> {
    await this.transport.disconnect();
  }

  public async publish<T>(event: EventContract<T>, priority: EventPriority = EventPriority.NORMAL, policy: DeliveryPolicy = DeliveryPolicy.AT_LEAST_ONCE): Promise<void> {
    await this.transport.publish(event, priority, policy);
  }

  public subscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void {
    this.transport.subscribe(category, handler);
  }

  public unsubscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void {
    this.transport.unsubscribe(category, handler);
  }
}
