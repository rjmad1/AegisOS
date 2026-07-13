// src/platform/governance/ArchitectureValidator.test.ts

import { describe, it, expect } from 'vitest';
import { ArchitectureValidator } from './ArchitectureValidator';

describe('ArchitectureValidator (Fitness Checks)', () => {
  it('should run static scans and report violations', () => {
    const validator = ArchitectureValidator.getInstance();
    const report = validator.validate();

    expect(report.timestamp).toBeDefined();
    expect(report.results.length).toBeGreaterThan(0);
    // It checking registry circularity should pass
    const registryCheck = report.results.find(r => r.rule.includes('Service Registry'));
    expect(registryCheck).toBeDefined();
    expect(registryCheck?.passed).toBe(true);
  });
});
