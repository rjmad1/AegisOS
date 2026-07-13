// src/platform/extension/ExtensionFramework.test.ts

import { describe, it, expect } from 'vitest';
import { ExtensionRegistry } from './ExtensionFramework';

describe('ExtensionFramework (Extension points)', () => {
  it('should support declaring extension points and registering extensions', () => {
    const registry = ExtensionRegistry.getInstance();
    registry.clear();

    registry.declareExtensionPoint({
      id: 'preview-provider',
      name: 'Preview Providers',
    });

    const mockImpl = { render: () => 'html' };
    registry.registerExtension({
      pointId: 'preview-provider',
      extensionId: 'html-previewer',
      implementation: mockImpl,
      priority: 10,
    });

    const extensions = registry.getExtensions('preview-provider');
    expect(extensions).toContain(mockImpl);
  });

  it('should sort registered extensions by priority', () => {
    const registry = ExtensionRegistry.getInstance();
    registry.clear();

    registry.declareExtensionPoint({ id: 'test-point', name: 'Test Point' });

    registry.registerExtension({ pointId: 'test-point', extensionId: 'low-prio', implementation: 'low', priority: 1 });
    registry.registerExtension({ pointId: 'test-point', extensionId: 'high-prio', implementation: 'high', priority: 100 });

    const extensions = registry.getExtensions<string>('test-point');
    expect(extensions[0]).toBe('high');
    expect(extensions[1]).toBe('low');
  });
});
