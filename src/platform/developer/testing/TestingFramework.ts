// src/platform/developer/testing/TestingFramework.ts

export class MockEventBus {
  private events: any[] = [];
  private handlers: Record<string, Array<(...args: any[]) => void>> = {};

  public async publish(event: any): Promise<void> {
    this.events.push(event);
    const list = this.handlers[event.name] || [];
    for (const h of list) {
      h(event);
    }
  }

  public subscribe(name: string, handler: (...args: any[]) => void): string {
    if (!this.handlers[name]) this.handlers[name] = [];
    this.handlers[name].push(handler);
    return `sub-${Math.random().toString(36).slice(2, 9)}`;
  }

  public getPublishedEvents(): any[] {
    return this.events;
  }

  public clear(): void {
    this.events = [];
    this.handlers = {};
  }
}

export class MockLogger {
  public infos: string[] = [];
  public warns: string[] = [];
  public errors: string[] = [];

  public info(msg: string, ...meta: any[]) { this.infos.push(msg); }
  public warn(msg: string, ...meta: any[]) { this.warns.push(msg); }
  public error(msg: string, err?: Error, ...meta: any[]) { this.errors.push(msg); }
}

export class SandboxMockContext {
  public eventBus = new MockEventBus();
  public logger = new MockLogger();
  public config: Record<string, any> = {};

  constructor(initialConfig?: Record<string, any>) {
    this.config = initialConfig || {};
  }
}

export class TestingFramework {
  private static instance: TestingFramework | null = null;

  private constructor() {}

  public static getInstance(): TestingFramework {
    if (!TestingFramework.instance) {
      TestingFramework.instance = new TestingFramework();
    }
    return TestingFramework.instance;
  }

  public createSandboxContext(initialConfig?: Record<string, any>): SandboxMockContext {
    return new SandboxMockContext(initialConfig);
  }

  // --- Assertion Helpers ---

  public assertEventPublished(bus: MockEventBus, eventName: string): boolean {
    const found = bus.getPublishedEvents().some(e => e.name === eventName);
    if (!found) {
      throw new Error(`Assertion Failed: Event "${eventName}" was not published to the event bus.`);
    }
    return true;
  }

  public assertLogContains(logger: MockLogger, severity: 'info' | 'warn' | 'error', text: string): boolean {
    const list = severity === 'info' ? logger.infos : severity === 'warn' ? logger.warns : logger.errors;
    const found = list.some(msg => msg.includes(text));
    if (!found) {
      throw new Error(`Assertion Failed: Log list for "${severity}" did not contain string "${text}".`);
    }
    return true;
  }
}

export const testingFramework = TestingFramework.getInstance();
export default testingFramework;
