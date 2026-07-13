// ============================================================================
// Runtime Context Engine — Async Context Propagation (Browser-safe)
// ============================================================================

import * as crypto from 'crypto';

export interface IRuntimeContext {
  correlationId: string;
  traceId: string;
  userId?: string;
  roles?: string[];
  tenantId?: string;
  [key: string]: unknown;
}

// Check if running in Node.js server runtime
const isNode = typeof process !== 'undefined' && process.release && process.release.name === 'node';

let asyncLocalStorage: any = null;

if (isNode) {
  try {
    const { AsyncLocalStorage } = require('async_hooks');
    asyncLocalStorage = new AsyncLocalStorage();
  } catch (err) {
    console.warn('[RuntimeContext] Failed to load AsyncLocalStorage, falling back to basic store', err);
  }
}

// Fallback in-memory store for client/browser environments
class BasicContextStore {
  private currentContext: IRuntimeContext | null = null;

  run(context: IRuntimeContext, callback: () => any) {
    const previous = this.currentContext;
    this.currentContext = context;
    try {
      return callback();
    } finally {
      this.currentContext = previous;
    }
  }

  getStore(): IRuntimeContext | null {
    return this.currentContext;
  }
}

const basicStore = new BasicContextStore();
const store = asyncLocalStorage || basicStore;

export class RuntimeContext {
  /**
   * Run a callback function within a specific context.
   */
  public static runWith<T>(context: Partial<IRuntimeContext>, callback: () => T): T {
    const parent = RuntimeContext.getCurrent();
    const correlationId = context.correlationId || parent?.correlationId || `corr-${crypto.randomUUID().slice(0, 8)}`;
    const traceId = context.traceId || parent?.traceId || `trace-${crypto.randomUUID().slice(0, 8)}`;

    const fullContext: IRuntimeContext = {
      ...parent,
      ...context,
      correlationId,
      traceId,
    };

    return store.run(fullContext, callback);
  }

  /**
   * Retrieve the current active context.
   */
  public static getCurrent(): IRuntimeContext | null {
    return store.getStore() || null;
  }

  /**
   * Retrieve the current correlation ID, generating one if not active.
   */
  public static getCorrelationId(): string {
    const ctx = RuntimeContext.getCurrent();
    return ctx?.correlationId || `corr-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Retrieve the current trace ID, generating one if not active.
   */
  public static getTraceId(): string {
    const ctx = RuntimeContext.getCurrent();
    return ctx?.traceId || `trace-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Retrieve the current user ID, if set in context.
   */
  public static getUserId(): string | undefined {
    const ctx = RuntimeContext.getCurrent();
    return ctx?.userId;
  }

  /**
   * Retrieve the current user roles, if set in context.
   */
  public static getRoles(): string[] | undefined {
    const ctx = RuntimeContext.getCurrent();
    return ctx?.roles;
  }

  /**
   * Wraps a function to preserve the current runtime context when executed later.
   */
  public static bind<T extends (...args: any[]) => any>(fn: T): T {
    const context = RuntimeContext.getCurrent();
    if (!context) return fn;
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      return RuntimeContext.runWith(context, () => fn(...args));
    }) as T;
  }
}

export default RuntimeContext;
