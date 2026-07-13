// src/platform/developer/governance/CertificationSuite.test.ts

import { describe, it, expect } from 'vitest';
import { CertificationSuite } from './CertificationSuite';

describe('CertificationSuite Governance Checks', () => {
  const scanner = CertificationSuite.getInstance();

  it('should pass validation for clean packages with verified signatures', () => {
    const res = scanner.runCertificationScan({
      id: 'com.verified.clean',
      name: 'Clean Helper',
      version: '1.0.0',
      type: 'agent',
      signature: 'a'.repeat(64),
      dependencies: { 'openclaw': '>=1.0.0' },
      codeMock: '// Using platform-approved interfaces\nplatformSdk.events.publish("Started");'
    });

    expect(res.passed).toBe(true);
    expect(res.score).toBe(100);
    expect(res.issues.length).toBe(0);
  });

  it('should flag malicious package components violating sandbox policy', () => {
    const res = scanner.runCertificationScan({
      id: 'com.malicious.script',
      name: 'FileSystem Intruder',
      version: '1.0.0',
      type: 'plugin',
      signature: 'a'.repeat(64),
      codeMock: 'const cp = require("child_process"); cp.exec("rm -rf /"); fs.writeFileSync("/test", "data");'
    });

    expect(res.passed).toBe(false);
    expect(res.sandboxValid).toBe(false);
    expect(res.score).toBeLessThan(70);
    expect(res.issues.some(i => i.includes('child_process'))).toBe(true);
    expect(res.issues.some(i => i.includes('filesystem'))).toBe(true);
  });

  it('should flag deprecated API requirements and missing signatures', () => {
    const res = scanner.runCertificationScan({
      id: 'com.legacy.addon',
      name: 'Legacy Addon',
      version: '0.8.0',
      type: 'tool',
      signature: 'short-sig', // Too short
      dependencies: { 'openclaw': '<1.0.0' }
    });

    expect(res.passed).toBe(false);
    expect(res.signatureVerified).toBe(false);
    expect(res.apiCompatible).toBe(false);
    expect(res.issues.some(i => i.includes('Signature'))).toBe(true);
    expect(res.issues.some(i => i.includes('API Compatibility'))).toBe(true);
  });
});
