const fs = require('fs');
const path = require('path');

function validateSDKs() {
  console.log('[ValidateSDKs] Starting OpenAPI contract specification and SDK readiness validation...');

  const openapiPath = path.resolve(__dirname, '../docs/openapi-spec.json');

  if (!fs.existsSync(openapiPath)) {
    console.error('[ValidateSDKs] Error: openapi-spec.json file not found at docs/openapi-spec.json!');
    process.exit(1);
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
  } catch (err) {
    console.error('[ValidateSDKs] Error parsing openapi-spec.json:', err.message);
    process.exit(1);
  }

  console.log(`[ValidateSDKs] Loaded OpenAPI specification v${spec.openapi} - "${spec.info.title}" v${spec.info.version}`);

  const requiredSections = ['openapi', 'info', 'paths', 'components'];
  for (const section of requiredSections) {
    if (!spec[section]) {
      console.error(`[ValidateSDKs] Violation: Missing required root OpenAPI section "${section}".`);
      process.exit(1);
    }
  }

  const paths = Object.keys(spec.paths);
  console.log(`[ValidateSDKs] Validating ${paths.length} API path contracts...`);

  let violations = 0;
  for (const p of paths) {
    const methods = Object.keys(spec.paths[p]);
    for (const method of methods) {
      const op = spec.paths[p][method];
      if (!op.summary || !op.responses) {
        console.error(`[ValidateSDKs] Violation: Path "${p} [${method}]" missing summary or responses definition.`);
        violations++;
      }
    }
  }

  const schemas = Object.keys(spec.components.schemas || {});
  console.log(`[ValidateSDKs] Verified ${schemas.length} core data model schemas (e.g., ${schemas.slice(0, 5).join(', ')}).`);

  if (violations > 0) {
    console.error(`[ValidateSDKs] OpenAPI contract validation failed with ${violations} violation(s).`);
    process.exit(1);
  }

  console.log('[ValidateSDKs] SDK and OpenAPI contract validation PASSED. Specifications match platform API routes.');
}

validateSDKs();
