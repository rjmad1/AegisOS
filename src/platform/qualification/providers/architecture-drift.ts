import { IQualificationProvider, QualificationRequest } from '../core/types';
import type { ValidationResult, ValidationDomain } from '../../validation/types';
import { computeContentHash } from '../../certification/evidence-graph';
import * as fs from 'fs';
import * as path from 'path';

export class ArchitectureDriftProvider implements IQualificationProvider {
  public readonly providerId = 'architecture-drift';
  public readonly supportedDomains: ValidationDomain[] = ['architecture'];
  public readonly dependencies = [];

  public async execute(request: QualificationRequest): Promise<ValidationResult> {
    console.log('[ArchitectureDriftProvider] Auditing 7-layered stack architecture drift...');
    const startTime = Date.now();
    const violations: string[] = [];
    const logs: string[] = [];

    // Scan src/infrastructure for imports crossing boundaries (importing src/app or src/components)
    const infraDir = path.resolve(process.cwd(), 'src', 'infrastructure');
    if (fs.existsSync(infraDir)) {
      this.scanDirectoryForImports(infraDir, violations, logs);
    } else {
      logs.push('Warning: src/infrastructure directory not found.');
    }

    const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 10);
    const status = violations.length === 0 ? 'PASS' : 'FAIL';

    const evidencePayload = {
      violations,
      auditedFilesCount: logs.length
    };

    const durationMs = Date.now() - startTime;

    return {
      id: `arch-drift-res-${Date.now()}`,
      name: 'Architecture Drift Audit',
      domain: 'architecture',
      status,
      score,
      durationMs,
      timestamp: new Date().toISOString(),
      message: violations.length === 0
        ? '7-Layered Autonomic architecture conforms to ADR import boundaries. Zero drift detected.'
        : `Detected ${violations.length} architectural drift boundaries import violations.`,
      evidence: {
        provenance: {
          traceId: `trace-arch-${Date.now()}`,
          executionId: `exec-arch-${Date.now()}`,
          gitSha: request.correlationId,
          platformVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          generatorId: this.providerId,
          generatorVersion: '1.0.0'
        },
        contentHash: computeContentHash(evidencePayload),
        logs: [
          ...logs,
          ...violations.map((v) => `[VIOLATION] ${v}`),
          `Completed architecture drift check. Status: ${status}`
        ],
        metrics: {
          violationsCount: violations.length,
          score
        }
      }
    };
  }

  private scanDirectoryForImports(dir: string, violations: string[], logs: string[]): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.scanDirectoryForImports(fullPath, violations, logs);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        logs.push(`Auditing file: ${entry.name}`);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, idx) => {
          // Look for import statement
          if (line.trim().startsWith('import ')) {
            // Check if importing from app/ or components/
            if (
              line.includes('@/app/') ||
              line.includes('/app/') ||
              line.includes('@/components/') ||
              line.includes('/components/') ||
              line.includes('../app') ||
              line.includes('../components')
            ) {
              const fileRelative = path.relative(process.cwd(), fullPath);
              violations.push(`${fileRelative}:${idx + 1} - Illegal import from presentation/view layer: "${line.trim()}"`);
            }
          }
        });
      }
    }
  }
}

export const architectureDriftProvider = new ArchitectureDriftProvider();
export default architectureDriftProvider;
