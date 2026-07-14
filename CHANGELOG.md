# Changelog

All notable changes to AegisOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- Removed all hardcoded credentials from tracked source files
- Replaced inline secret comparisons with blocklist pattern across auth modules
- Converted K8s secrets.yaml and Helm values to templates with placeholder values
- Removed hardcoded secrets from Dockerfile builder stage (now uses build args)
- Fixed login route to use `jose` SignJWT instead of custom HMAC implementation
- Fixed role mismatch: login now sets `role: "Administrator"` matching auth guard
- Removed hardcoded fallback in `secrets-platform.ts` encryption key derivation
- Added Redis authentication requirement to Docker Compose
- Pinned all container image versions (no more `:latest` tags)

### Added
- `.env.example` template with all required environment variables
- `SECURITY.md` at repository root (GitHub-discoverable)
- `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- `CHANGELOG.md` (Keep a Changelog format)
- `ARCHITECTURE.md` (C4 model summary)
- `.github/workflows/security-scan.yml` (CodeQL + dependency review)
- `.github/dependabot.yml` (npm, Actions, Docker monitoring)
- `.github/CODEOWNERS` (security-sensitive file routing)
- `docs/SECRETS_MANAGEMENT.md`
- `docs/THREAT_MODEL.md`
- `docs/CODING_STANDARDS.md`
- `docs/API_GUIDELINES.md`
- Unit test execution step in CI pipeline
- Dependency vulnerability audit step in CI pipeline

### Changed
- Docker Compose now requires `.env` file with credentials (fail-fast on missing)
- CI pipeline renamed from "AI Operations Console" to "AegisOS"
- Helm secrets template now validates all secrets are explicitly provided
- Secret scanner patterns expanded to catch additional credential patterns
- `vitest.config.ts` uses clearly-labeled test-only values

### Fixed
- `adminAuth.ts` role check (`"Administrator"`) now matches login route role value
- Removed deprecated `version: '3.8'` from Docker Compose files

## [1.0.0-RC1] - 2026-07-11

### Added
- Initial release candidate
- Next.js 16 Console administration dashboard
- Multi-provider secrets platform (Vault, AWS, GCP, Azure, Local DB)
- Zero Trust security proxy middleware with RBAC
- OpenTelemetry instrumentation
- Prisma ORM with SQLite/PostgreSQL support
- Enterprise SaaS models (Organization, Tenant, Workspace)
- Docker Compose multi-service deployment
- Kubernetes manifests and Helm chart
- PowerShell automation suite
- 8 Architecture Decision Records (ADR-001 through ADR-008)
