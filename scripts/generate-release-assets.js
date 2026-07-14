// scripts/generate-release-assets.js
// Automated release packaging asset generator compiling RC manifest, CycloneDX SBOM, checksums, and notes.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');

if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

console.log('[ReleaseEngineering] Initializing Release Candidate asset generation...');

// 1. Load package.json
const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkgJson.version || '0.1.0';
const releaseTag = `v${version}-RC1`;

// 2. Generate Release Metadata
const metadata = {
  releaseTag,
  version,
  buildTimestamp: new Date().toISOString(),
  environment: 'production',
  profile: 'enterprise',
  supportedOS: ['windows', 'linux', 'macos'],
  isolationModes: ['secure-context', 'sandbox', 'airgapped']
};
fs.writeFileSync(path.join(releaseDir, 'release-metadata.json'), JSON.stringify(metadata, null, 2));
console.log(' - Generated release-metadata.json');

// 3. Compile CycloneDX SBOM (Software Bill of Materials)
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${crypto.randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    component: {
      type: 'application',
      name: pkgJson.name || 'aegisos-console',
      version: version
    }
  },
  components: Object.keys(pkgJson.dependencies || {}).map(dep => ({
    type: 'library',
    name: dep,
    version: pkgJson.dependencies[dep].replace(/[\^~]/g, ''),
    purl: `pkg:npm/${dep}@${pkgJson.dependencies[dep].replace(/[\^~]/g, '')}`
  }))
};
fs.writeFileSync(path.join(releaseDir, 'sbom.json'), JSON.stringify(sbom, null, 2));
console.log(' - Generated sbom.json (CycloneDX)');

// 4. Generate Checksums of release target files
const filesToChecksum = [
  'package.json',
  'next.config.ts',
  'prisma/schema.prisma',
  'Bootstrap.ps1',
  'Caddyfile',
  'Dockerfile',
  'docker-compose.yml'
];

let checksumList = '';
filesToChecksum.forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    checksumList += `${hash}  ${file}\n`;
  }
});
fs.writeFileSync(path.join(releaseDir, 'checksums.sha256'), checksumList);
console.log(' - Generated checksums.sha256');

// 5. Compile Release Manifest
const manifest = {
  releaseTag,
  version,
  checksumsHash: crypto.createHash('sha256').update(checksumList).digest('hex'),
  assets: [
    'release-metadata.json',
    'sbom.json',
    'checksums.sha256',
    'RELEASE_NOTES.md',
    'UPGRADE_NOTES.md',
    'SUPPORT_MATRIX.md'
  ]
};
fs.writeFileSync(path.join(releaseDir, 'release-manifest.json'), JSON.stringify(manifest, null, 2));
console.log(' - Generated release-manifest.json');

// 6. Generate Release Notes & Support Matrix Markdown
const releaseNotes = `# Release Notes: AegisOS Console ${releaseTag}

## Overview
This Release Candidate transitions the AegisOS AI Operations Console into a true Enterprise-grade production platform. It resolves all Critical, High, and Medium findings from the independent architecture audit.

## Remediation & Enhancements
- **Active Directory/Entra ID Integration**: Added LDAP bind authentication and OIDC Microsoft Entra ID support to the Auth Module.
- **Token Rotation**: Automated refresh-token exchange checks on sliding active sessions to prevent token leakage.
- **Swappable Object Storage**: Swapped local file persistence with \`ObjectStoragePlatformProvider\`, providing out-of-the-box AWS S3, GCS, and Azure Blob Storage support.
- **Vault Integration**: Enforced AES-256-GCM encrypted database secrets storage, supporting integration with external HashiCorp Vault.
- **Circuit Breaker Routing**: Wrapped Ollama and LiteLLM inference calls in a resilient circuit breaker pattern to prevent cascading failures.
- **Grounding Math Validation**: Automated token-based cosine similarity checks validating RAG context against generated responses.
- **Transactional Workflows**: Integrated Saga compensation checkpoints with SQLite/Prisma transaction boundaries.
`;
fs.writeFileSync(path.join(releaseDir, 'RELEASE_NOTES.md'), releaseNotes);

const upgradeNotes = `# Upgrade & Migration Guide: v0.1.0 to v1.0.0-RC1

## Prerequisites
- Node.js v20+ installed.
- SQLite or Postgres active instance.
- Run database schema migration using \`npx prisma db push\`.

## Upgrade Steps
1. Run upgrade installer script: \`powershell.exe -File automation/Upgrade.ps1\`
2. The script will:
   - Create a snapshot backup of \`databases/dev.db\` and configurations.
   - Deploy new code packages.
   - Run Prisma migrations.
   - Verify socket and health states.
   - Rollback automatically if checks fail.
`;
fs.writeFileSync(path.join(releaseDir, 'UPGRADE_NOTES.md'), upgradeNotes);

const supportMatrix = `# Enterprise Compatibility & Support Matrix

## Operating System Compatibility
| Operating System | Supported Versions | Status |
|---|---|---|
| Windows | Windows 10, 11, Server 2022 | ✅ Certified |
| Linux | Ubuntu 22.04 LTS, 24.04 LTS, RHEL 9 | ✅ Certified |
| macOS | macOS Sonoma (v14), Sequoia (v15) | ✅ Supported |

## Subsystem Integrations
| Subsystem | Version Constraint | Verification Method |
|---|---|---|
| Ollama API | >= v0.1.48 | Direct Socket ping |
| LiteLLM Proxy | >= v1.40.0 | HTTP health check |
| Prisma Client | ^6.19.3 | Query test |
| SQLite Database | v3.x | File Access test |
`;
fs.writeFileSync(path.join(releaseDir, 'SUPPORT_MATRIX.md'), supportMatrix);
console.log(' - Compiled Release, Upgrade and Support markdown guides.');

console.log('[ReleaseEngineering] Release Candidate assets generated successfully inside /release.');
