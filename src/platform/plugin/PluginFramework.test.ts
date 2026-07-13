// src/platform/plugin/PluginFramework.test.ts

import { describe, it, expect, vi } from 'vitest';
import { PluginManager } from './PluginFramework';
import { IPlugin } from '@/api/types/plugins';

describe('PluginFramework (Plugin Manager)', () => {
  it('should verify dependency requirements and load plugins into register', async () => {
    const manager = PluginManager.getInstance();
    
    const initSpy = vi.fn();
    const shutdownSpy = vi.fn();

    const mockPlugin: IPlugin = {
      id: 'mock-storage-plugin',
      name: 'Mock Storage Plugin',
      version: '1.0.0',
      description: 'Storage simulation',
      author: 'Enterprise Platform Team',
      type: 'storage-provider',
      initialize: initSpy,
      shutdown: shutdownSpy,
      signature: "a".repeat(64),
    } as any;

    await manager.loadPlugin(mockPlugin);

    expect(initSpy).toHaveBeenCalled();
    expect(manager.getPlugin('mock-storage-plugin')).toBe(mockPlugin);

    await manager.unloadPlugin('mock-storage-plugin');
    expect(shutdownSpy).toHaveBeenCalled();
    expect(manager.getPlugin('mock-storage-plugin')).toBeNull();
  });
});
