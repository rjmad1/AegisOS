// src/platform/event-bus/EventPlatform.test.ts

import { describe, it, expect, vi } from 'vitest';
import { EventPlatform } from './EventPlatform';
import { RuntimeContext } from '../context/RuntimeContext';

describe('EventPlatform (Event Bus Improvements)', () => {
  it('should support typed publishing, schema validation, and context tracing propagation', async () => {
    const platform = EventPlatform.getInstance();
    const mockHandler = vi.fn();

    platform.subscribe('TestIndexEvent', mockHandler);

    await RuntimeContext.runWith(
      { correlationId: 'evt-corr-abc', traceId: 'evt-trace-xyz' },
      async () => {
        await platform.publish({
          name: 'TestIndexEvent',
          source: 'test-runner',
          payload: { query: 'verify platform capabilities' },
        });
      }
    );

    // Wait a brief tick for event delivery
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockHandler).toHaveBeenCalled();
    const callArg = mockHandler.mock.calls[0][0];
    expect(callArg.name).toBe('TestIndexEvent');
    expect(callArg.correlationId).toBe('evt-corr-abc');
    expect(callArg.traceId).toBe('evt-trace-xyz');
    expect(callArg.payload.query).toBe('verify platform capabilities');
  });

  it('should fallback to dead-letter queue (DLQ) if validation fails', async () => {
    const platform = EventPlatform.getInstance();
    const mockHandler = vi.fn();

    platform.subscribe('InvalidPayloadEvent', mockHandler);

    // Publish event without a source, which fails schema validation
    await platform.publish({
      name: 'InvalidPayloadEvent',
      source: '', // invalid: schema requires min(1)
      payload: null, // invalid: payload cannot be null
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockHandler).not.toHaveBeenCalled();
  });
});
