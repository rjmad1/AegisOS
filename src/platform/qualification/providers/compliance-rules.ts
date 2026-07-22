import { IQualificationProvider, QualificationRequest } from '../core/types';
import type { ValidationResult, ValidationDomain } from '../../validation/types';
import { computeContentHash } from '../../certification/evidence-graph';
import * as fs from 'fs';
import * as path from 'path';

export class ComplianceRulesProvider implements IQualificationProvider {
  public readonly providerId = 'compliance-rules';
  public readonly supportedDomains: ValidationDomain[] = ['governance'];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[ComplianceRulesProvider] Auditing SOC2 and security compliance rules...');
    const startTime = Date.now();
    const logs: string[] = [];
    const failures: string[] = [];

    // 1. Control AC-1: RBAC hasPermission
    const authPath = path.resolve(process.cwd(), 'src', 'platform', 'auth', 'authorization.ts');
    if (fs.existsSync(authPath)) {
      const content = fs.readFileSync(authPath, 'utf-8');
      if (content.includes('hasPermission')) {
        logs.push('Control AC-1 Pass: hasPermission checks verified in authorization.ts.');
      } else {
        failures.push('Control AC-1 Fail: hasPermission check missing in authorization.ts.');
      }
    } else {
      failures.push('Control AC-1 Fail: authorization.ts not found.');
    }

    // 2. Control CRYP-1: Data Encryption (aes-256-gcm)
    const secretsPlatformPath = path.resolve(process.cwd(), 'src', 'infrastructure', 'security', 'secrets-platform.ts');
    if (fs.existsSync(secretsPlatformPath)) {
      const content = fs.readFileSync(secretsPlatformPath, 'utf-8');
      if (content.includes('aes-256-gcm')) {
        logs.push('Control CRYP-1 Pass: aes-256-gcm encryption verified in secrets-platform.ts.');
      } else {
        failures.push('Control CRYP-1 Fail: secrets-platform.ts does not use aes-256-gcm.');
      }
    } else {
      failures.push('Control CRYP-1 Fail: secrets-platform.ts not found.');
    }

    // 3. Control AUD-1: Audit Trail tables
    const schemaPath = path.resolve(process.cwd(), 'prisma', 'schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf-8');
      const hasAuditLog = content.includes('model AuditLogEntry');
      const hasAuditEvent = content.includes('model AuditEvent');

      if (hasAuditLog && hasAuditEvent) {
        logs.push('Control AUD-1 Pass: AuditLogEntry and AuditEvent schemas verified in schema.prisma.');
      } else {
        failures.push('Control AUD-1 Fail: AuditLogEntry or AuditEvent model missing in schema.prisma.');
      }
    } else {
      failures.push('Control AUD-1 Fail: schema.prisma not found.');
    }

    const score = failures.length === 0 ? 100 : Math.max(0, 100 - failures.length * 30);
    const status = failures.length === 0 ? 'PASS' : 'FAIL';

    const evidencePayload = {
      score,
      failures
    };

    const durationMs = Date.now() - startTime;

    return {
      id: `compliance-res-${Date.now()}`,
      name: 'Compliance Auditing',
      domain: 'governance',
      status,
      score,
      durationMs,
      timestamp: new Date().toISOString(),
      message: failures.length === 0
        ? 'All compliance controls are compliant (AC-1, CRYP-1, AUD-1).'
        : `Compliance audit failed with ${failures.length} control violations.`,
      evidence: {
        provenance: {
          traceId: `trace-comp-${Date.now()}`,
          executionId: `exec-comp-${Date.now()}`,
          gitSha: request.correlationId,
          platformVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          generatorId: this.providerId,
          generatorVersion: '1.0.0'
        },
        contentHash: computeContentHash(evidencePayload),
        logs: [
          ...logs,
          ...failures.map((f) => `[FAILURE] ${f}`),
          `Compliance audit finished. Status: ${status}`
        ],
        metrics: {
          score,
          failuresCount: failures.length
        }
      }
    };
  }
}

export const complianceRulesProvider = new ComplianceRulesProvider();
export default complianceRulesProvider;
