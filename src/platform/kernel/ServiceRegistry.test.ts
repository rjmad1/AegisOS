// src/platform/kernel/ServiceRegistry.test.ts

import { describe, it, expect, vi } from 'vitest';
import { ServiceRegistry } from './ServiceRegistry';

describe('ServiceRegistry (Dependency Injection)', () => {
  it('should support registering and resolving singleton services', () => {
    const registry = new ServiceRegistry();
    let instanceCount = 0;
    
    registry.register('my.service', () => {
      instanceCount++;
      return { id: instanceCount };
    }, 'singleton');

    const s1 = registry.get<any>('my.service');
    const s2 = registry.get<any>('my.service');

    expect(s1.id).toBe(1);
    expect(s2.id).toBe(1);
    expect(s1).toBe(s2);
  });

  it('should support registering and resolving transient services', () => {
    const registry = new ServiceRegistry();
    let instanceCount = 0;

    registry.register('transient.service', () => {
      instanceCount++;
      return { id: instanceCount };
    }, 'transient');

    const s1 = registry.get<any>('transient.service');
    const s2 = registry.get<any>('transient.service');

    expect(s1.id).toBe(1);
    expect(s2.id).toBe(2);
    expect(s1).not.toBe(s2);
  });

  it('should throw an error for circular dependencies', () => {
    const registry = new ServiceRegistry();
    
    registry.register('service.a', (r) => {
      return { dep: r.get('service.b') };
    });
    
    registry.register('service.b', (r) => {
      return { dep: r.get('service.a') };
    });

    expect(() => registry.get('service.a')).toThrow('Circular dependency detected');
  });

  it('should support child scopes for request-scoped instances', () => {
    const rootRegistry = new ServiceRegistry();
    
    rootRegistry.register('scoped.service', () => {
      return { rand: Math.random() };
    }, 'scoped');

    const scope1 = rootRegistry.createScope();
    const scope2 = rootRegistry.createScope();

    const s1a = scope1.get<any>('scoped.service');
    const s1b = scope1.get<any>('scoped.service');
    const s2a = scope2.get<any>('scoped.service');

    expect(s1a).toBe(s1b);
    expect(s1a).not.toBe(s2a);
  });
});
