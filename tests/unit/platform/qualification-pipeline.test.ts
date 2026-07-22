import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { QualifyCommand } from '../../../src/platform/commands/qualify';

describe('AegisOS Production Qualification Pipeline Integration', () => {
  const outputDir = 'test-release-output';

  beforeAll(() => {
    // Clean target output dir
    const dest = path.resolve(process.cwd(), outputDir);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    const dest = path.resolve(process.cwd(), outputDir);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });

  it('should run qualification gate execution, render reports, build graph, and output signed manifest', async () => {
    // Set test env to scale down endurance runs
    Object.assign(process.env, { NODE_ENV: 'test' });

    const qualifyCmd = new QualifyCommand();
    const result = await qualifyCmd.execute({
      gateId: 'pr-gate',
      outputPath: outputDir,
      signProvider: 'sha256',
      secretSalt: 'test-salt'
    });

    // Check execution output
    expect(result.success).toBe(true);
    expect(result.reportPath).toBeDefined();

    const outputAbs = path.resolve(process.cwd(), outputDir);
    
    // Verify files were generated
    const manifestExists = fs.existsSync(path.join(outputAbs, 'release_manifest.json'));
    const graphExists = fs.existsSync(path.join(outputAbs, 'evidence_graph.json'));
    const readinessReportExists = fs.existsSync(path.join(outputAbs, 'production_readiness_report.md'));
    const chaosReportExists = fs.existsSync(path.join(outputAbs, 'chaos_report.md'));
    const jsonBundleExists = fs.existsSync(path.join(outputAbs, 'qualification_evidence_bundle.json'));

    expect(manifestExists).toBe(true);
    expect(graphExists).toBe(true);
    expect(readinessReportExists).toBe(true);
    expect(chaosReportExists).toBe(true);
    expect(jsonBundleExists).toBe(true);

    // Read and verify the manifest content
    const manifestData = JSON.parse(fs.readFileSync(path.join(outputAbs, 'release_manifest.json'), 'utf-8'));
    expect(manifestData.version).toBe('1.0.0');
    expect(manifestData.evidenceGraphRootHash).toBeDefined();
    expect(manifestData.signature).toBeDefined();
    expect(manifestData.signature.signatureAlgorithm).toBe('HMAC-SHA256');
    expect(manifestData.signature.signedHash).toBeDefined();
  });
});
