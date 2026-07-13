// src/platform/developer/testing/TestingFramework.test.ts

import { describe, it, expect } from 'vitest';
import { TestingFramework } from './TestingFramework';

describe('TestingFramework Sandbox Testing', () => {
  const framework = TestingFramework.getInstance();

  it('should create sandbox context and support publishing event assertions', () => {
    const sandbox = framework.createSandboxContext({ apiKey: "key-123" });
    expect(sandbox.config.apiKey).toBe("key-123");

    // Publish event
    sandbox.eventBus.publish({ name: 'ExecutionTriggered', payload: {} });

    // Assert using helper
    const assertRes = framework.assertEventPublished(sandbox.eventBus, 'ExecutionTriggered');
    expect(assertRes).toBe(true);

    // Assert missing event throws exception
    expect(() => {
      framework.assertEventPublished(sandbox.eventBus, 'MissingEvent');
    }).toThrow("Assertion Failed");
  });

  it('should support checking log content assertions', () => {
    const sandbox = framework.createSandboxContext();
    
    sandbox.logger.info("Initializing component AST compiler");
    sandbox.logger.warn("Circular reference warned");

    expect(framework.assertLogContains(sandbox.logger, 'info', 'compiler')).toBe(true);
    expect(framework.assertLogContains(sandbox.logger, 'warn', 'Circular')).toBe(true);

    expect(() => {
      framework.assertLogContains(sandbox.logger, 'error', 'Fatal');
    }).toThrow("Assertion Failed");
  });
});
