#!/bin/bash
# installers/install-macos.sh
# Enterprise Installation, Repair and Upgrade script for macOS hosts.

SILENT=false
REPAIR=false
UPGRADE=false
INSTALL_DIR="$HOME/Library/Application Support/OpenClaw"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --silent) SILENT=true ;;
        --repair) REPAIR=true ;;
        --upgrade) UPGRADE=true ;;
        --dir) INSTALL_DIR="$2"; shift ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

log() {
    if [ "$SILENT" = false ]; then
        echo "[Installer] $1"
    fi
}

log "Starting OpenClaw Console macOS Installer..."

if [ "$REPAIR" = true ]; then
    log "Running macOS local directory repair..."
    mkdir -p "$INSTALL_DIR"/{databases,artifacts_storage,configs,logs}
    log "Folders verified."
    exit 0
fi

if [ "$UPGRADE" = true ]; then
    log "Running upgrade database check..."
    if [ -f "$INSTALL_DIR/databases/dev.db" ]; then
        cp "$INSTALL_DIR/databases/dev.db" "$INSTALL_DIR/databases/dev_db_backup_pre_upgrade.db"
    fi
    cd "$INSTALL_DIR" || exit 1
    DATABASE_URL="file:./databases/dev.db" npx prisma db push --accept-data-loss
    exit 0
fi

log "Creating directories at: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"/{databases,artifacts_storage,configs,logs}

cp -r package.json prisma "$INSTALL_DIR/"
cd "$INSTALL_DIR" || exit 1
npm install --production
DATABASE_URL="file:./databases/dev.db" npx prisma db push

log "macOS Installation Completed successfully."
exit 0
