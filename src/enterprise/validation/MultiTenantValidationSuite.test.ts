// src/enterprise/validation/MultiTenantValidationSuite.test.ts
// Vitest runner for the Multi-Tenant validation suite

import { describe, it, expect } from 'vitest';
import { multiTenantValidationSuite } from './MultiTenantValidationSuite';

describe('AegisOS Enterprise SaaS Multi-Tenant Validation Suite', () => {
  it('should run all validation tests and pass 100%', async () => {
    const report = await multiTenantValidationSuite.runAll();
    
    console.log(`[Validation Suite Runner] Passed: ${report.passed}/${report.totalTests} tests`);
    
    if (report.failed > 0) {
      const failures = report.results.filter(r => r.status === 'fail');
      console.error('[Validation Failures]:', JSON.stringify(failures, null, 2));
    }

    expect(report.failed).toBe(0);
    expect(report.passed).toBeGreaterThan(0);
    expect(report.score).toBe(100);
  });
});
