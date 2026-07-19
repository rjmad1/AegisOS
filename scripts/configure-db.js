// scripts/configure-db.js
// Dynamically configure the database provider in prisma/schema.prisma
// and run prisma generate to build the correct Client binaries.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCHEMA_PATH = path.resolve(__dirname, '../prisma/schema.prisma');

function configureDb() {
  console.log('[ConfigureDB] Determining database provider configurations...');
  
  // Detect provider from env (defaults to sqlite)
  let provider = process.env.DATABASE_PROVIDER || 'sqlite';
  if (provider === 'postgres') {
    provider = 'postgresql';
  }

  // Read schema
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`[ConfigureDB] Schema file not found at ${SCHEMA_PATH}`);
    process.exit(1);
  }

  let schemaContent = fs.readFileSync(SCHEMA_PATH, 'utf-8');

  // Regex to match the datasource block and its provider line
  const datasourceRegex = /(datasource\s+db\s*{[\s\S]*?provider\s*=\s*")(\w+)("[[\s\S]*?})/;
  
  if (!datasourceRegex.test(schemaContent)) {
    console.error('[ConfigureDB] Could not find datasource db block with provider in schema.prisma');
    process.exit(1);
  }

  const currentProvider = schemaContent.match(datasourceRegex)[2];
  
  if (currentProvider === provider) {
    console.log(`[ConfigureDB] schema.prisma is already configured for provider: "${provider}"`);
  } else {
    console.log(`[ConfigureDB] Swapping provider from "${currentProvider}" to "${provider}"...`);
    schemaContent = schemaContent.replace(datasourceRegex, `$1${provider}$3`);
    fs.writeFileSync(SCHEMA_PATH, schemaContent, 'utf-8');
    console.log(`[ConfigureDB] Updated schema.prisma successfully.`);
  }

  // Generate Prisma Client
  try {
    console.log('[ConfigureDB] Running "prisma generate" to build Client binaries...');
    execSync('npx --no-install prisma generate', { stdio: 'inherit' });
    console.log('[ConfigureDB] Prisma Client compiled successfully.');
  } catch (err) {
    console.error('[ConfigureDB] Failed to run prisma generate:', err.message);
    process.exit(1);
  }
}

configureDb();
