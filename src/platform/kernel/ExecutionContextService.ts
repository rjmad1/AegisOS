import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import type { IExecutionContext, IExecutionContextProvider } from './types';

const StorageClass = (typeof AsyncLocalStorage === 'function')
  ? AsyncLocalStorage
  : class DummyLocalStorage<T> {
      private store: T | undefined;
      run<R>(store: T, callback: () => R): R {
        const prev = this.store;
        this.store = store;
        try {
          return callback();
        } finally {
          this.store = prev;
        }
      }
      getStore(): T | undefined {
        return this.store;
      }
    };

const safeRandomUUID = typeof randomUUID === 'function' ? randomUUID : () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class ExecutionContextService implements IExecutionContextProvider {
  private als = new StorageClass<IExecutionContext>();

  run<T>(context: IExecutionContext, fn: () => T): T {
    return this.als.run(context, fn);
  }

  runAsync<T>(context: IExecutionContext, fn: () => Promise<T>): Promise<T> {
    return this.als.run(context, fn);
  }

  current(): IExecutionContext | undefined {
    return this.als.getStore();
  }

  requireCurrent(): IExecutionContext {
    const ctx = this.current();
    if (!ctx) {
      throw new Error('[PECS] Execution context is required but none was found in the current async scope.');
    }
    return ctx;
  }

  create(partial?: Partial<IExecutionContext>): IExecutionContext {
    const parent = this.current();
    
    return {
      id: safeRandomUUID(),
      correlationId: partial?.correlationId || parent?.correlationId || safeRandomUUID(),
      causationId: partial?.causationId || parent?.id, // Parent ID becomes causation ID by default
      tenantId: partial?.tenantId ?? parent?.tenantId,
      workspaceId: partial?.workspaceId ?? parent?.workspaceId,
      projectId: partial?.projectId ?? parent?.projectId,
      agentId: partial?.agentId ?? parent?.agentId,
      userId: partial?.userId ?? parent?.userId,
      roles: partial?.roles ?? parent?.roles ?? [],
      securityLabels: partial?.securityLabels ?? parent?.securityLabels ?? [],
      operatingMode: partial?.operatingMode ?? parent?.operatingMode ?? 'balanced',
      logger: partial?.logger ?? parent?.logger ?? {
        info: (msg: string) => console.log(`[INFO] ${msg}`),
        warn: (msg: string) => console.warn(`[WARN] ${msg}`),
        error: (msg: string) => console.error(`[ERROR] ${msg}`),
        debug: (msg: string) => console.debug(`[DEBUG] ${msg}`)
      },
      ...partial,
    };
  }
}

// Singleton export
export const executionContextService = new ExecutionContextService();
