#!/bin/bash
# scripts/upgrade-rollback.sh
# Enterprise migration execution and automated rollback runner.

DB_DIR="./databases"
DB_FILE="$DB_DIR/dev.db"
BACKUP_FILE="$DB_DIR/dev_db_backup_pre_upgrade.db"

log() {
  echo -e "\e[32m[UpgradeFramework]\e[0m $1"
}

log_error() {
  echo -e "\e[31m[UpgradeFramework] ERROR: $1\e[0m" >&2
}

log "Step 1: Running Pre-Upgrade Verification..."

# Check database existence
if [ ! -f "$DB_FILE" ]; then
  log_error "Active SQLite database file not found at $DB_FILE. Cannot run upgrade."
  exit 1
fi

log "Step 2: backing up current database state..."
cp "$DB_FILE" "$BACKUP_FILE"
if [ $? -ne 0 ]; then
  log_error "Database backup failed. Aborting upgrade."
  exit 1
fi
log "Backup written: $BACKUP_FILE"

log "Step 3: Running Prisma database schema migrations..."
# Run Prisma push with temporary environment variable set
DATABASE_URL="file:./databases/dev.db" npx prisma db push --accept-data-loss
MIGRATION_STATUS=$?

if [ $MIGRATION_STATUS -ne 0 ]; then
  log_error "Prisma schema migration failed!"
  log "Initiating rollback sequence..."
  cp "$BACKUP_FILE" "$DB_FILE"
  log "Rollback complete. Restored dev.db to pre-upgrade state."
  exit 1
fi

log "Step 4: Executing post-upgrade health validation suite..."
# Execute tests to make sure application remains stable
npx vitest run src/platform/event-bus/EventPlatform.test.ts
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -ne 0 ]; then
  log_error "Post-upgrade validation tests failed!"
  log "Initiating automated rollback sequence..."
  cp "$BACKUP_FILE" "$DB_FILE"
  log "Rollback complete. Database state reverted to backup."
  exit 2
fi

log "Upgrade certification complete. System is healthy."
exit 0
