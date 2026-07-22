import { describe, it, expect, beforeEach } from 'vitest';
import { PolicyService } from './PolicyService';
import type { IExecutionContext } from './types';

describe('Platform Policy Service (PPS)', () => {
  let pps: PolicyService;

  beforeEach(() => {
    pps = new PolicyService();
  });

  it('should default deny if no rules match', () => {
    const result = pps.evaluate('execute', 'module:test');
    expect(result.action).toBe('deny');
    expect(result.source).toBe('kernel:default');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should evaluate rules based on string matching', () => {
    pps.registerRule({
      id: 'rule-1',
      actionPattern: 'read',
      resourcePattern: 'file:secure',
      evaluate: () => ({ action: 'permit' })
    });

    const result1 = pps.evaluate('read', 'file:secure');
    expect(result1.action).toBe('permit');

    const result2 = pps.evaluate('write', 'file:secure');
    expect(result2.action).toBe('deny');
  });

  it('should evaluate rules based on regex matching', () => {
    pps.registerRule({
      id: 'rule-2',
      actionPattern: /^write|delete$/,
      resourcePattern: /^db:.*$/,
      evaluate: () => ({ action: 'permit_with_constraints', constraints: { maxRows: 100 } })
    });

    const result1 = pps.evaluate('delete', 'db:users');
    expect(result1.action).toBe('permit_with_constraints');
    expect(result1.constraints).toEqual({ maxRows: 100 });

    const result2 = pps.evaluate('read', 'db:users');
    expect(result2.action).toBe('deny');
  });

  it('should inject context into evaluation', () => {
    pps.registerRule({
      id: 'rule-context',
      actionPattern: 'admin_action',
      evaluate: (_action, _resource, context) => {
        if (context?.roles.includes('admin')) {
          return { action: 'permit' };
        }
        return { action: 'deny', reason: 'Missing admin role' };
      }
    });

    const adminCtx: IExecutionContext = {
      id: '1', correlationId: '1', roles: ['admin'], securityLabels: [], operatingMode: 'balanced'
    } as unknown as IExecutionContext;
    
    const userCtx: IExecutionContext = {
      id: '2', correlationId: '2', roles: ['user'], securityLabels: [], operatingMode: 'balanced'
    } as unknown as IExecutionContext;

    expect(pps.evaluate('admin_action', undefined, adminCtx).action).toBe('permit');
    expect(pps.evaluate('admin_action', undefined, userCtx).action).toBe('deny');
    expect(pps.evaluate('admin_action', undefined, userCtx).reason).toBe('Missing admin role');
  });
});
