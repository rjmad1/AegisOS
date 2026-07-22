# AegisOS Knowledge Base: 17_AUTOMATION_CATALOG.md

## Script & CI/CD Automation Catalog

### PowerShell Workstation Automation (`automation/` & `Bootstrap.ps1`)
* `Bootstrap.ps1`: One-command installation & dependency verification (Git, Node.js, Python, CUDA, Docker, Ollama).
* `automation/libs/PlatformHelper.psm1`: PowerShell helper module for environment configuration, port scanning, service checks.
* `run.bat` / `deploy.bat`: Workstation daemon management scripts.
* `backup.bat` / `restore.bat`: Database & Digital Twin state snapshot tools.

### Background Daemons & Agents
* `AutonomicSelfHealingDaemon`: Background loop probing runtime loopback endpoints every 15s.
* `ConvergenceEngine`: Periodic Digital Twin state reconciliation loop.
* `CloudSpilloverRouter`: Telemetry-driven VRAM growth rate monitor.

### CI/CD Workflows (`.github/workflows/`)
* `ci.yml`: Automated Vitest unit test suite execution, TypeScript typechecking, and ESLint verification.
* `release.yml`: Release manifest cryptographic signing & package generation.
