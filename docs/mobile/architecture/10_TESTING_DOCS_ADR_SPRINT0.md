# §15 — Testing Strategy

> **Document**: AegisOS Mobile — Testing, Documentation, ADR Registry & Sprint Zero
> **Status**: DRAFT
> **Version**: 1.0.0
> **Last Updated**: 2026-07-13

---

## 15.1 Testing Pyramid

AegisOS Mobile enforces a strict testing standard across all modules. No code can be merged to `main` without satisfying minimum test coverage requirements (80% package-wide, 100% on security/enclave layers).

```
                      [End-to-End Tests] (5%)
                      • Real VPN connections
                      • Complete device-to-host execution
                                 │
                   [Golden / Visual Tests] (10%)
                   • Pixel-perfect adaptive screens
                   • Light/Dark theme rendering
                                 │
                 [Widget / UI Component Tests] (25%)
                 • Mocked presentation states
                 • Input gesture validations
                                 │
               [Unit / Business Logic Tests] (60%)
               • Pure Dart Use Case validations
               • Drift DB migration tests
```

---

## 15.2 Test Specifications

### Unit Tests
*   **Target**: Domain Entities, Value Objects, Use Cases, Repositories, Redactor Rules.
*   **Execution Tool**: Native Dart Test Runner (`dart test`).
*   **Mocks**: Mockito / Mocktail for repository implementations.
*   **CI Gate**: Required to pass before PR review allocation.

### Widget Tests
*   **Target**: Reusable UI atoms, molecules, features pages, state-to-UI bindings.
*   **Execution Tool**: Flutter Test framework (`flutter test`).
*   **Mocks**: Riverpod provider overrides (`ProviderScope(overrides: [...])`).
*   **Coverage Target**: Verification of all UI loading, success, and error state transitions.

### Integration Tests
*   **Target**: Device pairing flow, mTLS handshake, delta sync sequence, database offline queue caching.
*   **Execution Tool**: `integration_test` package. Runs on real device emulators (Android AVD/iOS Simulator) inside CI.
*   **Data Scenarios**: Programmatic mock servers mimicking host endpoints to simulate network disconnects and server timeouts.

### Golden Tests
*   **Target**: Adaptive layouts, dark mode typography, high-density charts, and tables.
*   **Execution Tool**: `golden_toolkit` package.
*   **Asserts**: Compares rendered widget sub-trees with pixel-perfect reference images.
*   **Verification**: Executed on both iOS and Android configurations to catch text clipping or color system drift.

### Performance Tests
*   **Target**: 60fps token streaming rendering, database read latency under 10k messages.
*   **Execution Tool**: Flutter driver performance profile tools.
*   **Metrics**: Frame rendering times, CPU spikes during decryption, battery drain profiles.

### Security and Penetration Tests
*   **Target**: SQLCipher DB file extraction, Keychain manipulation, certificate bypass.
*   **Execution Tool**: Custom automated scripts running on rooted/jailbroken emulators.
*   **Verification**: Ensures that backing database files cannot be read if copied off the device storage.

---

# §16 — Required Documentation

Before development on Sprint 1 begins, the following comprehensive engineering guides must be compiled and committed to the repository:

| Document ID | Title | Purpose | Audience |
|-------------|-------|---------|----------|
| **DOC-MOB-01** | *Local Client Setup & Pairing* | Instructions for setting up the local workspace CA, generating pairing QR codes, and debugging mTLS certificate errors. | Developers, QA |
| **DOC-MOB-02** | *Flutter Coding Standards* | Standard rules for file structure, naming conventions, import ordering, state notifier scoping, and build runner configurations. | Flutter Team |
| **DOC-MOB-03** | *mTLS & Cryptographic Signing Manual* | Low-level specifications detailing Secure Enclave integrations, signature payload hashing, and validation logic. | Security Architects, Platform Specialists |
| **DOC-MOB-04** | *Drift Migration & Backup Registry* | Table-by-table schema history, version mapping, and rollback scripts. | Database Engineers, Release Managers |
| **DOC-MOB-05** | *Adaptive Design System Specifications* | Detailed token sheets for spacing, custom colors, animations, and typography configurations. | UI/UX Developers, Design QA |

---

# §17 — Architecture Decision Records (ADRs)

The following ADRs must be drafted, reviewed, and marked as **APPROVED** by the Architecture Review Board prior to Sprint 1 commencement:

```
[ADR-MOB-001]
Choice of Flutter as Core Cross-Platform Mobile Engine
  ├── Rationale: Native performance, paint engine control, modular clean architecture capability
  └── Approved

[ADR-MOB-002]
Zero-Trust Connection Tunneling via Tailscale Mesh VPN
  ├── Rationale: Zero port exposure, Wireguard encryption, eliminates cloud hosting relay risk
  └── Approved

[ADR-MOB-003]
Drift and SQLCipher for AES-256-GCM On-Device Storage
  ├── Rationale: Type-safety, full relation mapping, hardware-enclave key derivation
  └── Approved

[ADR-MOB-004]
State Orchestration and Lifetime Management via Riverpod
  ├── Rationale: Compile-time provider graphs, declarative lifecycle management, isolate readiness
  └── Approved

[ADR-MOB-005]
Cryptographic signing for HITL (Human-In-The-Loop) Approvals
  ├── Rationale: ECDSA signature generation in Secure Enclave, replay protection, verification
  └── Approved
```

---

# §18 — Sprint Zero Plan

Sprint Zero establishes the local workstation infrastructure, installs required SDK wrappers, configures initial CI pipelines, and registers secure tunnels.

## 18.1 Execution Tasks

```
┌─────────────────────────────────────────────────────────────┐
│                      SPRINT ZERO TIMELINE                   │
├─────────────────────────────────────────────────────────────┤
│  Task 1: Workstation API and Gateway Extensions (Backend)   │
│  Task 2: Flutter Greenfield Setup & DI Engine (Mobile)      │
│  Task 3: Certificate Authority Setup & mTLS Proxy (Network) │
│  Task 4: SQLCipher Schema and Key Derivation (Storage)      │
│  Task 5: CI/CD Pipeline & Code Quality Baseline (DevSecOps) │
└─────────────────────────────────────────────────────────────┘
```

### Task 1: Workstation API and Gateway Extensions (Backend)
*   **Description**: Extend the Next.js API framework to expose version 2 endpoints `/api/v2/mobile/` and initialize WebSocket gateways.
*   **Dependencies**: Existing v1 API codebase, database prisma models.
*   **Acceptance Criteria**:
    *   Expose `/api/v2/mobile/sync` returning a mock delta payload.
    *   Expose `/ws/telemetry` running a connection loop that broadcasts host CPU/GPU metrics at 1Hz.
    *   All new controllers conform to the versioning guidelines established in §5.11.

### Task 2: Flutter Greenfield Setup & DI Engine (Mobile)
*   **Description**: Initialise the Flutter application module framework, package structure, and Riverpod DI registry.
*   **Dependencies**: Flutter SDK version 3.x, Dart SDK.
*   **Acceptance Criteria**:
    *   Verify greenfield app builds on both Android and iOS targets.
    *   Initialize folder directory layout according to the blueprint in §2.2.
    *   Configure `import_lint` rules in `analysis_options.yaml` to enforce Clean Architecture layer isolation.

### Task 3: Certificate Authority Setup & mTLS Proxy (Network)
*   **Description**: Deploy the host CA certificate generation pipeline and configure Nginx/Caddy reverse proxy rules to validate client certificates.
*   **Dependencies**: Task 1, Tailscale tunnel availability.
*   **Acceptance Criteria**:
    *   Proxy correctly rejects any direct connection attempts lacking client certificates.
    *   Handshake validates if client certificate CN matches a registered mobile device.
    *   Generate self-signed host CA certificate registry files in the `$PlatformRoot/secrets/` directory.

### Task 4: SQLCipher Schema and Key Derivation (Storage)
*   **Description**: Write platform channel wrappers connecting to iOS Secure Enclave / Android KeyStore, deriving database keys, and mounting the Drift database.
*   **Dependencies**: Task 2, platform security dependencies.
*   **Acceptance Criteria**:
    *   Drift DB file is successfully created in the app data directory.
    *   Enforce encryption validation: Reading the DB file with a plaintext SQLite browser must return raw encrypted bytes (corruption error).
    *   All tables from §7.2 are generated correctly on the first database mount.

### Task 5: CI/CD Pipeline & Code Quality Baseline (DevSecOps)
*   **Description**: Write GitHub Actions workflow files to compile the app, run lints, and execute unit/widget test pyramids automatically on every pull request.
*   **Dependencies**: Task 2.
*   **Acceptance Criteria**:
    *   Automated runner blocks pull requests failing `import_lint` rules or containing static analysis warnings.
    *   Setup test coverage reporter generating reports on codecov or local artifact storage.
    *   Establish code signing profiles for development builds.

---

## 18.2 Risk Analysis and Mitigations

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| **Secure Enclave Access Restrictions** | High | Medium | Provide software-based software keystores for development emulators while gating production builds strictly via hardware-enclave checks. |
| **Tailscale Tunnel Jitter** | Medium | High | Implement fallback to local Wi-Fi mDNS discovery when in close physical proximity to the workstation. Include automatic connection retry timers on network switches. |
| **mTLS Performance Overhead** | Low | Low | Keep mTLS handshakes persistent using HTTP/2 multiplexing, preventing renegotiations for every API query. |
| **Drift Code Generation Conflicts** | Low | Medium | Standardise the `build_runner` version inside `pubspec.yaml`, ensuring all developers use the exact package binaries. Run build cleaning steps inside build scripts. |

---

## 18.3 Deliverables

1.  **AegisOS Mobile Dart Workspace**: Complete codebase workspace with clean architecture boilerplate, lint specifications, and build configurations.
2.  **Host API Extension Patch**: Pull request exposing `/api/v2/` API controllers and mTLS verification proxy logic on the Next.js workstation host.
3.  **CI Build Pipeline**: Active GitHub Action workflows testing code styling, Clean Architecture import rules, and unit testing coverage automatically.
4.  **Pairing and Security Verification Report**: Verification logs demonstrating successful key generation, mTLS handshake resolution, and SQLCipher file verification.
