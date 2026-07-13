// src/platform/context/RuntimeContext.test.ts

import { describe, it, expect } from 'vitest';
import { RuntimeContext } from './RuntimeContext';

describe('RuntimeContext (Async Context Propagation)', () => {
  it('should propagate correlationId and traceId across asynchronous execution boundaries', async () => {
    await RuntimeContext.runWith(
      { correlationId: 'test-corr-123', traceId: 'test-trace-456', userId: 'user-789' },
      async () => {
        expect(RuntimeContext.getCorrelationId()).toBe('test-corr-123');
        expect(RuntimeContext.getTraceId()).toBe('test-trace-456');
        expect(RuntimeContext.getUserId()).toBe('user-789');

        // Test nested context
        await RuntimeContext.runWith({ userId: 'nested-user' }, () => {
          expect(RuntimeContext.getCorrelationId()).toBe('test-corr-123'); // Inherited
          expect(RuntimeContext.getUserId()).toBe('nested-user'); // Overridden
        });
      }
    );
  });

  it('should bind context to callbacks for later execution', () => {
    let boundFn: () => void = () => {};

    RuntimeContext.runWith({ correlationId: 'bound-corr' }, () => {
      boundFn = RuntimeContext.bind(() => {
        expect(RuntimeContext.getCorrelationId()).toBe('bound-corr');
      });
    });

    // Invoke callback outside the runWith block
    boundFn();
  });
});
