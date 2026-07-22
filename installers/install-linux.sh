#!/bin/bash
# installers/install-linux.sh
# Native Linux Installer wrapper. Delegates installation execution to PlatformBootstrapEngine.ps1.

INSTALL_DIR="/opt/aiplatform"

# Ensure pwsh (PowerShell Core) is available
if ! command -v pwsh &> /dev/null; then
    echo "[Installer] Installing PowerShell Core for cross-platform bootstrap..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y powershell
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y powershell
    else
        echo "[Installer] ERROR: pwsh not found. Please install PowerShell Core manually."
        exit 1
    fi
fi

# Locate the bootstrap engine script
SCRIPT_PATH="$(dirname "$0")/../automation/libs/PlatformBootstrapEngine.ps1"
if [ ! -f "$SCRIPT_PATH" ]; then
    SCRIPT_PATH="$(dirname "$0")/PlatformBootstrapEngine.ps1"
fi

echo "[Installer] Invoking AegisOS Platform Bootstrap Engine via PowerShell Core..."
pwsh -File "$SCRIPT_PATH" -PlatformRoot "$INSTALL_DIR"
exit $?
