// scripts/db-migration.js
// Automated data migration coordinator from SQLite to PostgreSQL for AegisOS.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STAGING_DIR = path.resolve(__dirname, '../databases/migration_staging');

const MODELS = [
  'User',
  'RolePermission',
  'Artifact',
  'Workflow',
  'WorkflowTemplate',
  'WorkflowExecution',
  'WorkflowSchedule',
  'WorkflowApproval',
  'WorkflowHistory',
  'AuditLogEntry',
  'AuditEvent',
  'Config',
  'ConfigHistory',
  'FeatureFlag',
  'Secret',
  'SchedulerJob',
  'Job',
  'SecurityState',
  'JobCheckpoint',
  'Session',
  'Organization',
  'Tenant',
  'Workspace',
  'Department',
  'BusinessUnit',
  'License',
  'Subscription',
  'UsageRecord',
  'Invoice',
  'GovernancePolicy',
  'WhiteLabelConfig',
  'MobileDevice',
  'MobileSession',
  'MobileRefreshToken',
  'PairingChallenge',
  'Command',
  'Conversation',
  'Message',
  'FeedbackTicket',
  'Skill',
  'SkillExecution',
  'SkillTelemetry',
  'EvaluationScorecard'
];

function getCamelCaseName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

async function runExport(sqliteUrl) {
  console.log(`[Migration] Starting data export from SQLite: ${sqliteUrl}`);
  if (!fs.existsSync(STAGING_DIR)) {
    fs.mkdirSync(STAGING_DIR, { recursive: true });
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: sqliteUrl }
    }
  });

  for (const modelName of MODELS) {
    const propName = getCamelCaseName(modelName);
    try {
      if (!prisma[propName]) {
        console.warn(`[Migration] Prisma model property ${propName} not found, skipping.`);
        continue;
      }
      const records = await prisma[propName].findMany();
      console.log(`[Migration] Exported ${records.length} records from ${modelName}.`);
      fs.writeFileSync(
        path.join(STAGING_DIR, `${modelName}.json`),
        JSON.stringify(records, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error(`[Migration] Failed to export table ${modelName}:`, err.message);
    }
  }
  await prisma.$disconnect();
  console.log('[Migration] Export phase completed successfully.');
}

async function runImport(postgresUrl) {
  console.log(`[Migration] Starting data import to PostgreSQL: ${postgresUrl}`);
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: postgresUrl }
    }
  });

  // Preserve foreign key dependency order (Conversation before Message)
  const orderedModels = [...MODELS];
  const convIndex = orderedModels.indexOf('Conversation');
  const msgIndex = orderedModels.indexOf('Message');
  if (convIndex !== -1 && msgIndex !== -1 && convIndex > msgIndex) {
    orderedModels[msgIndex] = 'Conversation';
    orderedModels[convIndex] = 'Message';
  }

  for (const modelName of orderedModels) {
    const filePath = path.join(STAGING_DIR, `${modelName}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[Migration] Staging file ${modelName}.json not found, skipping.`);
      continue;
    }

    const propName = getCamelCaseName(modelName);
    const records = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (records.length === 0) {
      console.log(`[Migration] Table ${modelName} has 0 staging records, skipping.`);
      continue;
    }

    console.log(`[Migration] Importing ${records.length} records into ${modelName}...`);
    try {
      if (!prisma[propName]) {
        console.warn(`[Migration] Prisma model property ${propName} not found, skipping.`);
        continue;
      }

      // Clear existing records to ensure idempotency
      await prisma[propName].deleteMany();

      // Convert date ISO strings back to JavaScript Dates only for actual DateTime fields in specific models
      const dateTimeFieldsMap = {
        'User': ['createdAt', 'updatedAt', 'deletedAt'],
        'Artifact': ['createdAt', 'updatedAt', 'deletedAt'],
        'Workflow': ['deletedAt'],
        'WorkflowExecution': ['deletedAt'],
        'Organization': ['createdAt', 'updatedAt', 'deletedAt'],
        'Tenant': ['createdAt', 'updatedAt', 'suspendedAt', 'archivedAt', 'deletedAt'],
        'Workspace': ['createdAt', 'updatedAt', 'deletedAt'],
        'Department': ['createdAt', 'updatedAt'],
        'BusinessUnit': ['createdAt', 'updatedAt'],
        'License': ['activatedAt', 'expiresAt', 'renewalDate', 'createdAt', 'updatedAt'],
        'Subscription': ['currentPeriodStart', 'currentPeriodEnd', 'trialEndsAt', 'cancelledAt', 'createdAt', 'updatedAt'],
        'UsageRecord': ['timestamp'],
        'Invoice': ['periodStart', 'periodEnd', 'dueDate', 'paidAt', 'createdAt'],
        'GovernancePolicy': ['createdAt', 'updatedAt'],
        'WhiteLabelConfig': ['updatedAt'],
        'MobileDevice': ['createdAt', 'updatedAt', 'approvedAt', 'revokedAt'],
        'MobileSession': ['createdAt', 'expiresAt', 'lastActive'],
        'MobileRefreshToken': ['createdAt', 'expiresAt'],
        'PairingChallenge': ['expiresAt'],
        'Command': ['scheduledAt', 'createdAt', 'startedAt', 'completedAt', 'nextAttemptAt', 'expiresAt', 'rolledBackAt'],
        'Conversation': ['createdAt', 'updatedAt'],
        'Message': ['createdAt'],
        'FeedbackTicket': ['timestamp'],
        'Skill': ['createdAt', 'updatedAt', 'deletedAt'],
        'SkillExecution': ['createdAt', 'updatedAt'],
        'SkillTelemetry': ['timestamp']
      };

      const preparedRecords = records.map(r => {
        const copy = { ...r };
        const modelDTFields = dateTimeFieldsMap[modelName] || [];
        for (const [key, val] of Object.entries(copy)) {
          if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
            if (modelDTFields.includes(key)) {
              copy[key] = new Date(val);
            }
          }
        }
        return copy;
      });

      // Insert records using createMany for PostgreSQL (high performance)
      await prisma[propName].createMany({
        data: preparedRecords,
        skipDuplicates: true
      });
      console.log(`[Migration] Successfully imported ${records.length} records into ${modelName}.`);
    } catch (err) {
      console.error(`[Migration] Failed to import table ${modelName}:`, err.message);
    }
  }

  await prisma.$disconnect();
  console.log('[Migration] Import phase completed successfully.');
}

function runCoordinator(sqliteUrl, postgresUrl) {
  console.log('[Migration] Starting database migration coordinator...');

  console.log('[Migration] Phase 1/5: Swapping provider to sqlite...');
  execSync('node scripts/configure-db.js', {
    env: { ...process.env, DATABASE_PROVIDER: 'sqlite' },
    stdio: 'inherit'
  });

  console.log('[Migration] Phase 2/5: Exporting sqlite data...');
  execSync('node scripts/db-migration.js export', {
    env: { ...process.env, SQLITE_MIGRATION_URL: sqliteUrl },
    stdio: 'inherit'
  });

  console.log('[Migration] Phase 3/5: Swapping provider to postgresql...');
  execSync('node scripts/configure-db.js', {
    env: { ...process.env, DATABASE_PROVIDER: 'postgres' },
    stdio: 'inherit'
  });

  console.log('[Migration] Phase 4/5: Initializing PostgreSQL tables (prisma db push)...');
  execSync('npx prisma db push --accept-data-loss', {
    env: { ...process.env, DATABASE_URL: postgresUrl },
    stdio: 'inherit'
  });

  console.log('[Migration] Phase 5/5: Importing data into PostgreSQL...');
  execSync('node scripts/db-migration.js import', {
    env: { ...process.env, POSTGRES_MIGRATION_URL: postgresUrl },
    stdio: 'inherit'
  });

  // Clean up staging directory
  try {
    console.log('[Migration] Cleaning up migration JSON staging files...');
    const files = fs.readdirSync(STAGING_DIR);
    for (const file of files) {
      fs.unlinkSync(path.join(STAGING_DIR, file));
    }
    fs.rmdirSync(STAGING_DIR);
  } catch (err) {
    console.warn('[Migration] Warning: Staging cleanup incomplete:', err.message);
  }

  console.log('[Migration] Database migration completed successfully.');
}

// CLI Routing
const action = process.argv[2];
if (action === 'export') {
  const sqliteUrl = process.env.SQLITE_MIGRATION_URL || 'file:../databases/dev.db';
  runExport(sqliteUrl).catch(err => {
    console.error('[Migration] Export failed:', err);
    process.exit(1);
  });
} else if (action === 'import') {
  const postgresUrl = process.env.POSTGRES_MIGRATION_URL || 'postgresql://postgres:postgres@localhost:5432/aegisos';
  runImport(postgresUrl).catch(err => {
    console.error('[Migration] Import failed:', err);
    process.exit(1);
  });
} else {
  // Default runner
  const sqliteUrl = process.env.SQLITE_URL || 'file:../databases/dev.db';
  const postgresUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/aegisos';
  runCoordinator(sqliteUrl, postgresUrl);
}
