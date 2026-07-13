// src/platform/developer/DeveloperPlatform.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { DeveloperPlatform } from './DeveloperPlatform';

describe('DeveloperPlatform Registry & Analytics', () => {
  let platform: DeveloperPlatform;

  beforeEach(() => {
    platform = DeveloperPlatform.getInstance();
    platform.clear();
  });

  it('should support declaring extension points and listing them', () => {
    platform.declareExtensionPoint({
      id: 'custom-mcp-provider',
      name: 'Custom MCP Providers',
      description: 'Connected servers',
      version: '1.0.0'
    });

    const points = platform.getExtensionPoints();
    expect(points.some(p => p.id === 'custom-mcp-provider')).toBe(true);
  });

  it('should support registering extensions and querying them', () => {
    platform.declareExtensionPoint({
      id: 'custom-preview',
      name: 'Custom Previewers',
      version: '1.0.0'
    });

    const mockImpl = { render: () => 'div' };
    platform.registerExtension({
      pointId: 'custom-preview',
      extensionId: 'custom-pdf-viewer',
      version: '1.1.2',
      implementation: mockImpl,
      priority: 15,
      state: 'loaded'
    });

    const list = platform.getExtensions('custom-preview');
    expect(list.length).toBe(1);
    expect(list[0].extensionId).toBe('custom-pdf-viewer');
    expect(list[0].implementation).toBe(mockImpl);
  });

  it('should enforce entitlements and meter usage charges', () => {
    platform.registerEntitlement({
      tenantId: 'tenant-test',
      licenseKey: 'LIC-OPENCLAW-DEV-TEST',
      tier: 'developer',
      status: 'active',
      expiresAt: '2030-01-01T00:00:00Z',
      features: ['standard-plugins'],
      usageLimits: { 'concurrent-plugins': 2 }
    });

    expect(platform.verifyEntitlement('tenant-test', 'standard-plugins')).toBe(true);
    expect(platform.verifyEntitlement('tenant-test', 'premium-plugins')).toBe(false);

    // Record billing usage
    platform.publishToMarketplace({
      id: 'com.test.metered',
      name: 'Metered Plugin',
      version: '1.0.0',
      type: 'plugin',
      description: 'test description',
      author: 'Tester',
      license: 'MIT',
      pricingType: 'metered',
      price: 0.15,
      ratingsCount: 0,
      ratingsAverage: 0,
      reviews: [],
      dependencies: {},
      signature: 'a'.repeat(64),
      isVerified: true,
      downloadCount: 0,
      metadata: {}
    });

    platform.recordUsage({
      id: 'usage-1',
      tenantId: 'tenant-test',
      itemId: 'com.test.metered',
      metricName: 'execution',
      quantity: 10,
      timestamp: new Date().toISOString()
    });

    const analytics = platform.getAnalytics();
    expect(analytics.licensingCharges).toBe(1.50); // 0.15 * 10
  });
});
