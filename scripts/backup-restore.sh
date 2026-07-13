#!/bin/bash
# scripts/backup-restore.sh
# Enterprise automated database, artifact, and configurations backup/restore orchestrator.
# Supports both SQLite/Local FS and PostgreSQL/MinIO environments.

set -e

ACTION=$1
BACKUP_DIR=${2:-"/tmp/openclaw-backups"}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ARCHIVE="${BACKUP_DIR}/openclaw_backup_${TIMESTAMP}.tar.gz"

# Load environment configs
DATABASE_PROVIDER=${DATABASE_PROVIDER:-"sqlite"}
DATABASE_URL=${DATABASE_URL:-"file:../databases/dev.db"}
OPS_ARTIFACTS_DIR=${OPS_ARTIFACTS_DIR:-"./artifacts_storage"}
OPS_CONFIG_PATH=${OPS_CONFIG_PATH:-"./console_config.json"}

log_action() {
  echo -e "\033[1;34m[BackupEngine] $1\033[0m"
}

log_success() {
  echo -e "\033[1;32m[BackupEngine] SUCCESS: $1\033[0m"
}

log_error() {
  echo -e "\033[1;31m[BackupEngine] ERROR: $1\033[0m"
}

ensure_directories() {
  mkdir -p "${BACKUP_DIR}"
  mkdir -p "${BACKUP_DIR}/db"
  mkdir -p "${BACKUP_DIR}/artifacts"
  mkdir -p "${BACKUP_DIR}/configs"
}

backup_database() {
  log_action "Initiating Database Backup..."
  if [ "$DATABASE_PROVIDER" = "postgres" ] || [ "$DATABASE_PROVIDER" = "postgresql" ]; then
    log_action "Backing up PostgreSQL Database..."
    # Extract connection variables from DATABASE_URL
    # Format expected: postgresql://user:pass@host:port/dbname
    pg_dump "${DATABASE_URL}" -F c -b -v -f "${BACKUP_DIR}/db/postgres_backup.dump"
    log_success "PostgreSQL dump created."
  else
    log_action "Backing up SQLite Database..."
    # Strip "file:" prefix if present
    SQLITE_PATH=$(echo "${DATABASE_URL}" | sed 's/file://')
    if [ -f "${SQLITE_PATH}" ]; then
      cp "${SQLITE_PATH}" "${BACKUP_DIR}/db/sqlite_backup.db"
      log_success "SQLite backup file copied."
    else
      log_error "SQLite database file not found at ${SQLITE_PATH}!"
    fi
  fi
}

backup_artifacts() {
  log_action "Initiating Artifacts Backup..."
  if [ "${OBJECT_STORAGE_PROVIDER}" = "minio" ] || [ "${OBJECT_STORAGE_PROVIDER}" = "s3" ]; then
    log_action "Syncing cloud object storage bucket to backup directory..."
    # Sync using AWS CLI / MinIO mc client
    if command -v aws &> /dev/null; then
      aws s3 sync "s3://${AWS_S3_BUCKET}" "${BACKUP_DIR}/artifacts/s3_sync" --endpoint-url "${MINIO_ENDPOINT}"
      log_success "Object Storage sync complete."
    else
      log_action "AWS CLI not found. Copying local directory as fallback."
      if [ -d "${OPS_ARTIFACTS_DIR}" ]; then
        cp -r "${OPS_ARTIFACTS_DIR}/." "${BACKUP_DIR}/artifacts/"
      fi
    fi
  else
    log_action "Backing up local filesystem artifacts..."
    if [ -d "${OPS_ARTIFACTS_DIR}" ]; then
      cp -r "${OPS_ARTIFACTS_DIR}/." "${BACKUP_DIR}/artifacts/"
      log_success "Local artifacts copied."
    else
      log_error "Artifacts directory not found at ${OPS_ARTIFACTS_DIR}!"
    fi
  fi
}

backup_configs() {
  log_action "Initiating Configuration Backup..."
  if [ -f "${OPS_CONFIG_PATH}" ]; then
    cp "${OPS_CONFIG_PATH}" "${BACKUP_DIR}/configs/console_config.json"
    log_success "Platform configuration file backed up."
  fi
  
  # Copy .env configuration variables
  if [ -f ".env.production" ]; then
    cp ".env.production" "${BACKUP_DIR}/configs/.env.production"
  fi
  if [ -f ".env.local" ]; then
    cp ".env.local" "${BACKUP_DIR}/configs/.env.local"
  fi
}

compress_backup() {
  log_action "Compressing backup artifacts..."
  tar -czf "${BACKUP_ARCHIVE}" -C "${BACKUP_DIR}" db artifacts configs
  log_success "Backup archive created successfully at: ${BACKUP_ARCHIVE}"
  
  # Clean temporary backup dirs
  rm -rf "${BACKUP_DIR}/db" "${BACKUP_DIR}/artifacts" "${BACKUP_DIR}/configs"
}

restore_backup() {
  local archive_file=$2
  if [ -z "${archive_file}" ] || [ ! -f "${archive_file}" ]; then
    log_error "Please specify a valid backup archive file path to restore!"
    exit 1
  fi

  log_action "Restoring from archive: ${archive_file}..."
  
  # Decompress archive
  ensure_directories
  tar -xzf "${archive_file}" -C "${BACKUP_DIR}"

  # 1. Restore database
  if [ "$DATABASE_PROVIDER" = "postgres" ] || [ "$DATABASE_PROVIDER" = "postgresql" ]; then
    log_action "Restoring PostgreSQL database..."
    if [ -f "${BACKUP_DIR}/db/postgres_backup.dump" ]; then
      # Run restore
      pg_restore -d "${DATABASE_URL}" --clean --verbose "${BACKUP_DIR}/db/postgres_backup.dump"
      log_success "PostgreSQL database restored."
    else
      log_error "PostgreSQL backup dump file not found in archive!"
    fi
  else
    log_action "Restoring SQLite database..."
    SQLITE_PATH=$(echo "${DATABASE_URL}" | sed 's/file://')
    if [ -f "${BACKUP_DIR}/db/sqlite_backup.db" ]; then
      mkdir -p "$(dirname "${SQLITE_PATH}")"
      cp "${BACKUP_DIR}/db/sqlite_backup.db" "${SQLITE_PATH}"
      log_success "SQLite database restored."
    else
      log_error "SQLite backup file not found in archive!"
    fi
  fi

  # 2. Restore artifacts
  log_action "Restoring artifacts..."
  if [ -d "${BACKUP_DIR}/artifacts" ]; then
    mkdir -p "${OPS_ARTIFACTS_DIR}"
    cp -r "${BACKUP_DIR}/artifacts/." "${OPS_ARTIFACTS_DIR}/"
    log_success "Artifacts restored to ${OPS_ARTIFACTS_DIR}"
  fi

  # 3. Restore configs
  log_action "Restoring configs..."
  if [ -f "${BACKUP_DIR}/configs/console_config.json" ]; then
    cp "${BACKUP_DIR}/configs/console_config.json" "${OPS_CONFIG_PATH}"
    log_success "Platform configurations restored to ${OPS_CONFIG_PATH}"
  fi

  # Clean temporary dirs
  rm -rf "${BACKUP_DIR}/db" "${BACKUP_DIR}/artifacts" "${BACKUP_DIR}/configs"
  log_success "Restore process completed."
}

# Run orchestrator
case "$ACTION" in
  backup)
    ensure_directories
    backup_database
    backup_artifacts
    backup_configs
    compress_backup
    ;;
  restore)
    restore_backup "$@"
    ;;
  *)
    echo "Usage: $0 {backup|restore} [backup_archive_file_path]"
    exit 1
    ;;
esac
