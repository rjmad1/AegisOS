#!/bin/bash
# installers/install-macos.sh
# Native macOS Installer wrapper. Delegates installation execution to PlatformBootstrapEngine.ps1.

INSTALL_DIR="$HOME/Library/Application Support/AegisOS"

# Ensure pwsh (PowerShell Core) is available
if ! command -v pwsh &> /dev/null; then
    echo "[Installer] Installing PowerShell Core for cross-platform bootstrap..."
    if command -v brew &> /dev/null; then
        brew install --cask powershell
    else
        echo "[Installer] ERROR: brew not found. Please install PowerShell Core manually."
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
