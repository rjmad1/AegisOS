export enum EventPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  BACKGROUND = 'BACKGROUND',
  TELEMETRY = 'TELEMETRY',
  GARBAGE_COLLECTION = 'GARBAGE_COLLECTION'
}

export enum DeliveryPolicy {
  FIRE_AND_FORGET = 'FIRE_AND_FORGET',
  AT_MOST_ONCE = 'AT_MOST_ONCE',
  AT_LEAST_ONCE = 'AT_LEAST_ONCE',
  EXACTLY_ONCE = 'EXACTLY_ONCE',
  ORDERED = 'ORDERED',
  TRANSACTIONAL = 'TRANSACTIONAL'
}

export interface EventContract<T = any> {
  id: string;
  version: string;
  aggregateId?: string;
  correlationId?: string;
  causationId?: string;
  timestamp: number;
  originatingSubsystem: string;
  category: string;
  payload: T;
  securityClassification: string;
  tenantId?: string;
  workspaceId?: string;
  projectId?: string;
  executionContext?: string;
}

export interface IEventPublisher {
  publish<T>(event: EventContract<T>, priority?: EventPriority, policy?: DeliveryPolicy): Promise<void>;
}

export interface IEventSubscriber {
  subscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void;
  unsubscribe<T>(category: string, handler: (event: EventContract<T>) => Promise<void>): void;
}

export interface IEventTransport extends IEventPublisher, IEventSubscriber {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface IEventStore {
  append(event: EventContract): Promise<void>;
  getEventsForAggregate(aggregateId: string): Promise<EventContract[]>;
  replay(category: string, since: number, handler: (event: EventContract) => Promise<void>): Promise<void>;
}

export interface IEventSerializer {
  serialize(event: EventContract): string | Buffer;
  deserialize(data: string | Buffer): EventContract;
}
