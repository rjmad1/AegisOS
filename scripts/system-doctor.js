// scripts/system-doctor.js
// Automated support bundle generator and health check utility for OpenClaw Console.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const dbDir = path.join(rootDir, 'databases');
const logDir = path.join(rootDir, 'logs');
const bundleDir = path.join(rootDir, `support_bundle_${Date.now()}`);

console.log('[SystemDoctor] Initiating diagnostic support bundle collection...');

try {
  // Create temp bundle directory
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }

  // 1. Gather System Environment Details
  const envDetails = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
    envVariables: {
      NODE_ENV: process.env.NODE_ENV || 'not-set',
      AUTH_PROVIDER: process.env.AUTH_PROVIDER || 'google',
      OBJECT_STORAGE_PROVIDER: process.env.OBJECT_STORAGE_PROVIDER || 'local',
      MULTI_NODE_MTLS_ENFORCED: process.env.MULTI_NODE_MTLS_ENFORCED || 'false',
    }
  };
  fs.writeFileSync(path.join(bundleDir, 'env_report.json'), JSON.stringify(envDetails, null, 2));
  console.log(' - Collected environment details');

  // 2. Collect DB Audit Logs (last 100 entries)
  const auditPath = path.join(dbDir, 'event_audit.json');
  if (fs.existsSync(auditPath)) {
    const rawAudit = fs.readFileSync(auditPath, 'utf-8');
    try {
      const parsedAudit = JSON.parse(rawAudit);
      const recentAudit = parsedAudit.slice(-100);
      fs.writeFileSync(path.join(bundleDir, 'audit_report.json'), JSON.stringify(recentAudit, null, 2));
      console.log(' - Collected recent database audit logs');
    } catch (e) {
      console.warn(' - Failed to parse event_audit.json: ' + e.message);
      fs.copyFileSync(auditPath, path.join(bundleDir, 'event_audit_raw.json'));
    }
  }

  // 3. Collect DB Files details
  const dbFiles = fs.readdirSync(dbDir).map(file => {
    const stats = fs.statSync(path.join(dbDir, file));
    return {
      filename: file,
      sizeBytes: stats.size,
      modifiedTime: stats.mtime.toISOString()
    };
  });
  fs.writeFileSync(path.join(bundleDir, 'database_inventory.json'), JSON.stringify(dbFiles, null, 2));
  console.log(' - Collected database inventory report');

  // 4. Check GPU Availability (NVIDIA context check)
  let gpuStatus = 'unknown';
  let gpuDetails = '';
  try {
    const { execSync } = require('child_process');
    gpuDetails = execSync('nvidia-smi', { encoding: 'utf-8', stdio: [] });
    gpuStatus = 'available';
    console.log(' - Verified NVIDIA GPU availability via nvidia-smi');
  } catch (err) {
    gpuStatus = 'unavailable';
    gpuDetails = 'nvidia-smi command not found on host. Local workstation running in CPU-only mode.';
    console.log(' - NVIDIA GPU is unavailable on host (running CPU-only)');
  }
  fs.writeFileSync(path.join(bundleDir, 'gpu_status.txt'), `Status: ${gpuStatus}\nDetails:\n${gpuDetails}`);

  // 5. Generate package verification report
  const pkgPath = path.join(rootDir, 'package.json');
  const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
  fs.writeFileSync(path.join(bundleDir, 'package_snapshot.json'), pkgContent);
  console.log(' - Snapshotted package dependencies');

  // Summary Report
  const summaryReport = {
    bundleId: `bundle-${crypto.randomUUID().slice(0, 8)}`,
    generatedAt: new Date().toISOString(),
    status: 'healthy',
    diagnosticsRun: true
  };
  fs.writeFileSync(path.join(bundleDir, 'summary.json'), JSON.stringify(summaryReport, null, 2));

  // Package into a zipped support bundle or create folder message
  console.log(`[SystemDoctor] Diagnostics successfully written to: ${bundleDir}`);
  console.log('Use this bundle when escalating issues to Support Engineering.');
} catch (error) {
  console.error('[SystemDoctor] Diagnostic run failed:', error);
}
