import { describe, it, expect } from 'vitest';
import { executionContextService } from './ExecutionContextService';
import type { IExecutionContext } from './types';

describe('Platform Execution Context Service (PECS)', () => {
  it('should create an initial execution context with a unique ID', () => {
    const ctx = executionContextService.create({ tenantId: 'tenant-1' });
    expect(ctx).toBeDefined();
    expect(ctx.id).toBeDefined();
    expect(ctx.correlationId).toBeDefined();
    expect(ctx.tenantId).toBe('tenant-1');
  });

  it('should propagate context through synchronous run', () => {
    const rootCtx = executionContextService.create({ tenantId: 'tenant-root' });
    
    executionContextService.run(rootCtx, () => {
      const current = executionContextService.current();
      expect(current).toEqual(rootCtx);
      expect(current?.tenantId).toBe('tenant-root');
      expect(executionContextService.requireCurrent()).toEqual(rootCtx);
    });

    expect(executionContextService.current()).toBeUndefined();
  });

  it('should propagate context through asynchronous runAsync', async () => {
    const rootCtx = executionContextService.create({ tenantId: 'tenant-async' });
    
    await executionContextService.runAsync(rootCtx, async () => {
      // Simulate async boundary
      await new Promise((resolve) => setTimeout(resolve, 10));
      
      const current = executionContextService.current();
      expect(current).toEqual(rootCtx);
    });

    expect(executionContextService.current()).toBeUndefined();
  });

  it('should prevent leaking context across concurrent executions', async () => {
    const p1 = executionContextService.runAsync(
      executionContextService.create({ tenantId: 't1' }),
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return executionContextService.current()?.tenantId;
      }
    );

    const p2 = executionContextService.runAsync(
      executionContextService.create({ tenantId: 't2' }),
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return executionContextService.current()?.tenantId;
      }
    );

    const [t1, t2] = await Promise.all([p1, p2]);

    expect(t1).toBe('t1');
    expect(t2).toBe('t2');
  });

  it('should inherit correlationId and create causationId for child contexts', () => {
    const parent = executionContextService.create({ correlationId: 'corr-123' });
    
    executionContextService.run(parent, () => {
      const child = executionContextService.create({ agentId: 'agent-1' });
      
      expect(child.correlationId).toBe('corr-123');
      expect(child.causationId).toBe(parent.id);
      expect(child.agentId).toBe('agent-1');
    });
  });

  it('should throw if requireCurrent is called outside a context', () => {
    expect(() => executionContextService.requireCurrent()).toThrowError(/Execution context is required/);
  });
});
