import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import type { IExecutionContext, IExecutionContextProvider } from './types';

export class ExecutionContextService implements IExecutionContextProvider {
  private als = new AsyncLocalStorage<IExecutionContext>();

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
      id: randomUUID(),
      correlationId: partial?.correlationId || parent?.correlationId || randomUUID(),
      causationId: partial?.causationId || parent?.id, // Parent ID becomes causation ID by default
      tenantId: partial?.tenantId ?? parent?.tenantId,
      workspaceId: partial?.workspaceId ?? parent?.workspaceId,
      projectId: partial?.projectId ?? parent?.projectId,
      agentId: partial?.agentId ?? parent?.agentId,
      userId: partial?.userId ?? parent?.userId,
      roles: partial?.roles ?? parent?.roles ?? [],
      securityLabels: partial?.securityLabels ?? parent?.securityLabels ?? [],
      operatingMode: partial?.operatingMode ?? parent?.operatingMode ?? 'balanced',
      ...partial,
    };
  }
}

// Singleton export
export const executionContextService = new ExecutionContextService();
