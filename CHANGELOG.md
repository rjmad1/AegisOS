# Changelog

All notable changes to AegisOS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.5] - 2026-07-23

### Added
- **Zero-Loopback In-Memory Token Introspection Engine**: Implemented `token-introspector.ts` in `src/platform/auth/` for zero-latency, pure in-memory JWT verification, Prisma session checking, IP network boundary validation, and role permission resolution without HTTP network loopbacks.
- **Security Unit Test Suite**: Added Vitest test suite `token-introspector.test.ts` verifying zero-trust authorization, expired tokens, invalid signatures, and permission enforcement (4/4 tests passing in 49ms).
- **Release Readiness & Engineering Audit**: Produced comprehensive Due Diligence Assessment Report, Risk Matrix, CMMI Maturity Model scoring, and Release Readiness Report.

### Fixed
- **Proxy Middleware Self-Loopback Performance Bottleneck**: Refactored `src/proxy.ts` and `/api/v1/auth/token/introspect` route to execute `introspectToken` in memory, eliminating 15–50ms+ HTTP latency overhead per request and preventing self-referential thread pool starvation.
- **Coverage Configuration**: Expanded `vitest.config.ts` coverage `include` patterns to encompass all `src/**/*.ts` and `src/**/*.tsx` modules.

## [1.2.4] - 2026-07-23

### Added
- **Autonomic Self-Healing Daemon**: Implemented `AutonomicSelfHealingDaemon.ts` for real-time background health sweeps across local runtimes (`Console Portal`, `AegisOS Gateway`, `LiteLLM Router`, `Ollama Inference`, `OTel Collector`) with automatic fault recovery and `hardenedEventBus` event emission (`AutonomicHealthReport`).
- **Autonomic Self-Healing REST API**: Added GET/POST route `/api/v1/system/autonomic-heal` for system health diagnostics and daemon lifecycle control.
- **Hardware Telemetry Event Bus**: Created `hardware-telemetry-bus.ts` to stream Layer 0 GPU CUDA metrics directly to the Control Plane.
- **Predictive VRAM Velocity Spillover**: Upgraded `CloudSpilloverRouter.ts` with dynamic VRAM consumption velocity calculation ($\Delta VRAM / \Delta t$) across rolling 60-second telemetry windows for preemptive cloud bursting before GPU OOM memory limits are reached.
- **Zero-Touch Entra ID / SAML Group Role Mapping**: Implemented `GroupClaimRoleMapper.ts` for zero-touch regex and DN parsing of SAML/OIDC group claims, integrated directly into `SamlProvider.ts`.
- **Unit Test Suite Expansion**: Added Vitest test suites for autonomic self-healing, predictive spillover math, and group claim role mapping (`8/8` tests passing).

## [1.2.3] - 2026-07-22

### Added
- Universal Release Readiness: Completed 12-phase engineering readiness review, quality gate verification, and repository synchronization.
- Thin-Edge Ingestion: Added `aegis-webhook` integration to `conversa_repo` for raw transcript handoff to AegisOS.

### Fixed
- ESLint configuration: Extended `globalIgnores` in `eslint.config.mjs` to include `.agents/**`, `.aegisos/**`, and `dist/**` to prevent generated artifacts and agent skills from triggering lint failures.
- Vitest workspace configuration: Updated `exclude` patterns in `vitest.config.ts` to `**/node_modules/**` ensuring nested package test suites are excluded from main root unit test runner.

## [1.2.2] - 2026-07-21

### Fixed
- Fixed ESLint errors across the codebase including Next.js `<a>` link violations in auth pages, missing display names for dynamically generated components, and type definition warnings in capability runtime.
- Resolved unescaped quote syntax errors in `LocalCapabilityProvider`.
- Addressed C4 Architecture Fitness Violation by abstracting database `workflowRepository` calls in API layer via the `workflowService`.

## [1.2.1] - 2026-07-20

### Added
- Phase 7 Ecosystem & Productization: Delivered dynamic Provider Packs (Ollama, LiteLLM, OpenAI, Gemini) and Enterprise Connectors (GitHub, Jira) as dynamically loadable platforms extensions.
- Marketplace & Packaging Lifecycle: Implemented `MarketplaceService` to handle package publishing, signing verification, sandbox installations, and catalog queries inside the existing `Artifact` model.
- Declarative Deployment Blueprints: Defined the DBS schema and created blueprints for Kubernetes, Air-Gapped, Edge, GPU-Workstation, Team, and Knowledge-Worker editions.
- Developer Experience Toolkit: Created `Developer.ps1` and Next.js APIs under `/api/v1/developer` for one-command workspace initialization, scaffolding generators, and qualification checks.
- Unified Governance & Quality Cockpit: Extended `pmiEngine` to calculate Platform Readiness Index (PRI), Knowledge Maturity Model (KMM), Governance Compliance Matrix (GCM), and CER exceptions.
- Formulated extensive governance guides: Contribution Guide, Maintainer Guide, Plugin Certification Guide, and SDK specifications.

### Fixed
- Reliability test suite: replaced real OS-level calls (port scanning, `taskkill`, docker compose) with proper `vi.mock()` stubs for deterministic, isolated test execution.
- Port configuration drift: reset `configs/ports.json` to canonical default ports after runtime `resolvePortCollision` had mutated stored values.
- `PortRegistry` static cache: added `reset()` method so tests reload port configuration from file between runs.
- `PlanningEngine.planRecovery()`: recovery step task text now includes the word "recovery" to match test assertion `s.task.includes("recovery")`.
- `AIRuntimeValidationSuite`: added `agent:research` to `AgentRuntime` default agent catalog so the sandbox routing validation check passes.
- Fault provider mocks: switched from `vi.fn().mockImplementation()` (non-constructable) to `class` factory exports for vitest 4.x compatibility.

### Changed
- Port test expectations updated from drifted values (e.g. `11435`) to canonical defaults (e.g. `11434`).

## [1.2.0] - 2026-07-14

### Added
- Transitioned platform to a strict 7-layered Autonomic AI Workstation Operating System architecture (ADR-009).
- Established the Executive Control Plane (ECP) at Layer 5 to enforce real-time security policies, rate limits, and model output grounding filters (ADR-010).
- Implemented System Digital Twin with canonical state Graph Kernel, Projections registry, and real-time Topology explorer.
- Developed Convergence Engine for periodic state reconciliation and automatic Drift logs tracking.
- Developed Autonomic Platform Qualification Framework (PQF) with modular validation orchestrators (chaos, scalability, performance, endurance).
- Created content-addressed, immutable Merkle-like Evidence Graph for progressive chain-of-trust qualification.
- Implemented cryptographic Release Manifest signing (HMAC-SHA256) and signature verifications.
- Developed Engineering Intelligence Platform (EIP) service orchestrating predictive analytics, log correlation, and prioritized remediation queues.
- Implemented Platform Maturity Index (PMI) Engine to compute weighted indices across 11 key operational domains.
- Implemented Command & Control (C2) subsystem supporting ECDSA signature verification, replay protection, dynamic risk-based policies, and compensating actions (rollbacks) (ADR-013).
- Developed Flutter-based Mobile Companion App (`aegis_mobile`) for remote executive monitoring and Human-in-the-Loop (HITL) approval gates.
- Added WebSocket-based real-time telemetry syncing.
- Integrated Voice Feedback subsystem in the Console sidebar with REST API upload and secure download endpoints.

### Changed
- Rebranded console interfaces, registries, API routes, and environment profiles from "OpenClaw" to "AegisOS".

## [1.1.0] - 2026-07-14

### Added
- Flutter-based Mobile Companion App (`aegis_mobile`) for remote executive monitoring and human approval gates.
- Command & Control (C2) subsystem with ECDSA cryptographic signatures, transaction nonces, clock skew bounds, and dynamic risk-based policies.
- Human-in-the-Loop (HITL) approval gates and Rollback Engine for compensating database/state mutations on execution failure.
- WebSocket server and real-time telemetry streaming for live resource usage and logs.
- Voice Feedback subsystem in the Console sidebar with REST API upload and secure download endpoints.
- `.env.example` template with all required environment variables.
- `SECURITY.md` at repository root.
- `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1).
- `ARCHITECTURE.md` (C4 model summary).
- `.github/workflows/security-scan.yml` (CodeQL + dependency review).
- `.github/dependabot.yml` (npm, Actions, Docker monitoring).
- `.github/CODEOWNERS` (security-sensitive file routing).
- `docs/SECRETS_MANAGEMENT.md`.
- `docs/THREAT_MODEL.md`.
- `docs/CODING_STANDARDS.md`.
- `docs/API_GUIDELINES.md`.
- Unit test execution step in CI pipeline.
- Dependency vulnerability audit step in CI pipeline.
- Implemented robust security hardening: true JWT signing, HttpOnly cookies, brute-force lockout, CSRF protection, rate limiting, and security headers via proxy middleware.
- Created production infrastructure components: Caddy reverse proxy configuration, CI/CD GitHub Actions pipeline, deployment automation scripts, and health/liveness probes.

### Changed
- Rebranded console interfaces, API routes, and CI configs from "OpenClaw" to "AegisOS".
- Docker Compose now requires `.env` file with credentials (fail-fast on missing).
- Helm secrets template now validates all secrets are explicitly provided.
- Secret scanner patterns expanded to catch additional credential patterns.
- `vitest.config.ts` uses clearly-labeled test-only values.
- Externalized environment configuration for all infrastructure services to use `OPS_*` variables instead of hardcoded paths.

### Fixed
- `adminAuth.ts` role check (`"Administrator"`) now matches login route role value.
- Removed deprecated `version: '3.8'` from Docker Compose files.

### Security
- Removed all hardcoded credentials from tracked source files.
- Replaced inline secret comparisons with blocklist pattern across auth modules.
- Converted K8s secrets.yaml and Helm values to templates with placeholder values.
- Removed hardcoded secrets from Dockerfile builder stage (now uses build args).
- Fixed login route to use `jose` SignJWT instead of custom HMAC implementation.
- Fixed role mismatch: login now sets `role: "Administrator"` matching auth guard.
- Removed hardcoded fallback in `secrets-platform.ts` encryption key derivation.
- Added Redis authentication requirement to Docker Compose.
- Pinned all container image versions.

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
