#!/bin/bash
# installers/install-linux.sh
# Enterprise Installation, Repair and Upgrade script for Linux platforms.

SILENT=false
REPAIR=false
UPGRADE=false
INSTALL_DIR="/opt/aiplatform"

# Parse arguments
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
        echo -e "\e[36m[Installer]\e[0m $1"
    fi
}

log_warn() {
    if [ "$SILENT" = false ]; then
        echo -e "\e[33m[Installer] WARNING: $1\e[0m"
    fi
}

log_error() {
    echo -e "\e[31m[Installer] ERROR: $1\e[0m" >&2
}

log "Starting AegisOS Console Linux Installer..."

# Enforce root or sudo check
if [ "$EUID" -ne 0 ]; then
    log_error "Installation requires root/sudo privileges!"
    exit 1
fi

# 1. Handle Repair
if [ "$REPAIR" = true ]; then
    log "Running repair verification..."
    mkdir -p "$INSTALL_DIR"/{databases,artifacts_storage,configs,logs}
    chmod -R 750 "$INSTALL_DIR"
    log "Folders verified. Permissions set."
    exit 0
fi

# 2. Handle Upgrade
if [ "$UPGRADE" = true ]; then
    log "Beginning upgrade sequence..."
    if [ -f "$INSTALL_DIR/databases/dev.db" ]; then
        cp "$INSTALL_DIR/databases/dev.db" "$INSTALL_DIR/databases/dev_db_backup_pre_upgrade.db"
        log "Database snapshot backup written."
    fi

    # Run Prisma migration sync
    cd "$INSTALL_DIR" || exit 1
    DATABASE_URL="file:./databases/dev.db" npx prisma db push --accept-data-loss
    if [ $? -eq 0 ]; then
        log "Database schema migration successful."
    else
        log_error "Schema migration failed! Rolling back database..."
        if [ -f "$INSTALL_DIR/databases/dev_db_backup_pre_upgrade.db" ]; then
            cp "$INSTALL_DIR/databases/dev_db_backup_pre_upgrade.db" "$INSTALL_DIR/databases/dev.db"
            log_warn "Database state restored to pre-upgrade snapshot."
        fi
        exit 1
    fi
    exit 0
fi

# 3. Fresh Install Flow
log "Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"/{databases,artifacts_storage,configs,logs}

# Create dedicated non-root user for security compliance
if ! id -u aiuser >/dev/null 2>&1; then
    log "Creating system user 'aiuser' for runtime execution..."
    useradd -r -s /bin/false aiuser
fi

# Copy app files
cp -r package.json prisma "$INSTALL_DIR/"

log "Installing production node modules..."
cd "$INSTALL_DIR" || exit 1
npm install --production

# DB sync
DATABASE_URL="file:./databases/dev.db" npx prisma db push

# Owner permissions
chown -R aiuser:aiuser "$INSTALL_DIR"
chmod -R 750 "$INSTALL_DIR"

log "AegisOS Platform Installation Complete."
exit 0
