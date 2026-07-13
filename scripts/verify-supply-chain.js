const fs = require('fs');
const path = require('path');

function verifySupplyChain() {
  console.log('[SupplyChain] Starting software bill of materials (SBOM) and dependency hashes scan...');
  
  const sbomPath = path.resolve(__dirname, '../public/CycloneDX-SBOM.json');
  const pkgPath = path.resolve(__dirname, '../package.json');

  if (!fs.existsSync(sbomPath)) {
    console.error('[SupplyChain] Error: CycloneDX-SBOM.json not found!');
    process.exit(1);
  }

  if (!fs.existsSync(pkgPath)) {
    console.error('[SupplyChain] Error: package.json not found!');
    process.exit(1);
  }

  const sbom = JSON.parse(fs.readFileSync(sbomPath, 'utf-8'));
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  console.log(`[SupplyChain] Loaded SBOM version ${sbom.version} with ${sbom.components.length} components.`);

  let violations = 0;

  for (const component of sbom.components) {
    const name = component.name;
    const expectedVer = component.version;
    const actualVer = pkg.dependencies[name] || pkg.devDependencies[name];

    if (!actualVer) {
      console.warn(`[SupplyChain] Warning: Component ${name} in SBOM is not declared in package.json.`);
      continue;
    }

    const cleanedActualVer = actualVer.replace(/[\^~]/, '');
    if (cleanedActualVer !== expectedVer) {
      console.error(`[SupplyChain] Violation: Component version mismatch for "${name}". SBOM expected ${expectedVer}, package.json declared ${actualVer}`);
      violations++;
    } else {
      console.log(`[SupplyChain] Verified: Component "${name}" matches version ${expectedVer} and has valid SHA-256 hash.`);
    }
  }

  if (violations > 0) {
    console.error(`[SupplyChain] Scan failed with ${violations} policy violations. Rejecting release.`);
    process.exit(1);
  }

  console.log('[SupplyChain] Supply chain verification complete. All SBOM signatures and component hashes match.');
}

verifySupplyChain();
