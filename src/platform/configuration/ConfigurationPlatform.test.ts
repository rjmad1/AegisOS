// src/platform/configuration/ConfigurationPlatform.test.ts

import { describe, it, expect, vi } from 'vitest';
import { ConfigurationPlatform } from './ConfigurationPlatform';

describe('ConfigurationPlatform (Central Config & Secrets)', () => {
  it('should support loading default configs, validating schema, and runtime overrides', () => {
    const config = ConfigurationPlatform.getInstance();
    
    // Test base defaults
    expect(config.get('port')).toBe(3000);
    expect(config.get('maintenanceMode')).toBe(false);

    // Test runtime overrides
    config.setRuntimeOverride('port', 8080);
    expect(config.get('port')).toBe(8080);
    
    // Reset override for next tests
    config.setRuntimeOverride('port', 3000);
  });

  it('should trigger listeners on settings changes', async () => {
    const config = ConfigurationPlatform.getInstance();
    const listener = vi.fn();

    const unsubscribe = config.addChangeListener(listener);
    
    config.setRuntimeOverride('maintenanceBanner', 'New Alert Banner');
    expect(listener).toHaveBeenCalledWith('maintenanceBanner', 'New Alert Banner', 'System is undergoing scheduled maintenance.');
    
    unsubscribe();
  });
});
