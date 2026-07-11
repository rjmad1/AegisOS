# Changelog

All notable changes to the AI Workstation platform will be documented in this file.

## [1.1.0] - 2026-07-11
### Added
- Implemented robust security hardening: true JWT signing, HttpOnly cookies, brute-force lockout, CSRF protection, rate limiting, and security headers via proxy middleware.
- Created production infrastructure components: Caddy reverse proxy configuration, CI/CD GitHub Actions pipeline, deployment automation scripts, and health/liveness probes.
### Changed
- Externalized environment configuration for all infrastructure services to use `OPS_*` variables instead of hardcoded paths.

## [1.0.0] - 2026-07-10
### Added
- Created interactive `Bootstrap.ps1` installer at the root directory.
- Created `automation/libs/PlatformHelper.psm1` shared library for uniform logging, elevation checks, and DPAPI operations.
- Added platform catalogs under `automation/catalogs/` mapping system dependencies, models, services, scripts, configurations, and APIs.
- Added parameterized deployment profiles (`default`, `development`, `personal`, `enterprise`, `offline`) in `automation/profiles/`.
- Created ADR records (ADR-001 through ADR-008) under `adr/`.
- Created `automation/Package.ps1` to bundle shareable, clean distribution archives.

### Changed
- Re-engineered all PowerShell scripts under `Deployment/` to use `PlatformHelper.psm1` and moved them to `automation/`.
- Merged separate multi-step disaster recovery modules from `DisasterRecovery/` into the consolidated `automation/Restore.ps1` and `automation/Validate.ps1`.
- Rationalized system documentation: removed loose root-level markdown logs and generated structured guides under `docs/`.

### Removed
- Deleted empty `As Is State Documentation_July 09 2026/` folder.
- Removed duplicate and legacy scripts under `DisasterRecovery/`.
