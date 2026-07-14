# §3 — Layered Architecture

> **Document**: AegisOS Mobile — Layered Architecture Definition
> **Status**: DRAFT
> **Version**: 1.0.0

---

## 3.1 Architecture Overview

AegisOS Mobile implements a **Clean Architecture** variant with 8 distinct layers. The dependency rule is strictly enforced: **outer layers depend on inner layers; inner layers never reference outer layers**.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRESENTATION (outermost — UI, widgets, pages)                   │
├─────────────────────────────────────────────────────────────────┤
│  APPLICATION (use cases, orchestrators)                           │
├─────────────────────────────────────────────────────────────────┤
│  DOMAIN (innermost business — entities, value objects, contracts) │
├─────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (implementations — API, DB, storage)             │
├─────────────────────────────────────────────────────────────────┤
│  PLATFORM (OS bridges — biometric, connectivity, enclave)        │
├─────────────────────────────────────────────────────────────────┤
│  SHARED (cross-cutting — validators, formatters, mixins)         │
├─────────────────────────────────────────────────────────────────┤
│  UTILITIES (pure functions — date, string, crypto helpers)       │
├─────────────────────────────────────────────────────────────────┤
│  CORE (foundation — constants, types, errors, logging, network)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3.2 Layer Definitions

### Layer 1: Presentation

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Render UI, capture user input, dispatch events to the application layer, and display state changes. |
| **Responsibilities** | • Pages (full-screen routes) • Widgets (reusable UI components) • Controllers/Notifiers (Riverpod state holders) • Design system tokens and atomic components • Navigation shell and route guards • Animations and micro-interactions • Accessibility label assignment • Adaptive layout orchestration (compact/medium/expanded) |
| **Allowed Dependencies** | `Application`, `Domain` (entities for display), `Shared`, `Utilities`, `Core` |
| **Forbidden Dependencies** | `Infrastructure` (no direct HTTP calls, DB queries, or platform channel invocations from widgets), `Platform` (access only via Application layer) |

**Rationale**: Isolating the presentation from infrastructure ensures that UI tests (widget tests, golden tests) never require HTTP mocking or database setup. All external data flows through Riverpod providers that can be trivially overridden.

---

### Layer 2: Application

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Orchestrate business workflows by coordinating domain entities, repository contracts, and platform services. Implement use cases. |
| **Responsibilities** | • Use case classes (single-responsibility command/query handlers) • Input/output DTOs for use case boundaries • Business rule orchestration (e.g., "flush offline queue, then resolve conflicts, then update UI") • Mapping between domain entities and presentation view models • Error mapping (domain failures → user-facing error states) • Cross-feature coordination (e.g., auth state change triggers sync engine restart) |
| **Allowed Dependencies** | `Domain`, `Shared`, `Utilities`, `Core` |
| **Forbidden Dependencies** | `Presentation` (no widget imports), `Infrastructure` (no concrete implementations — only abstract repository contracts from Domain), `Platform` (access via injected abstractions only) |

**Rationale**: Use cases are the application's API surface. They are framework-agnostic and testable with pure Dart unit tests. The application layer never knows whether data comes from SQLCipher, REST, or WebSocket — it only knows repository contracts.

---

### Layer 3: Domain

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Define the core business entities, value objects, and repository contracts that represent the AegisOS domain model. This is the innermost, most stable layer. |
| **Responsibilities** | • Entity classes (e.g., `Agent`, `Conversation`, `TelemetrySnapshot`, `ApprovalRequest`) • Value objects (e.g., `HostAddress`, `DeviceId`, `ModelAlias`, `CertificateFingerprint`) • Enum types (e.g., `AgentStatus`, `ApprovalState`, `SyncStatus`) • Failure types (sealed classes representing domain errors) • Abstract repository contracts (interfaces that infrastructure must implement) • Domain events (e.g., `AgentStateChanged`, `ApprovalSubmitted`) |
| **Allowed Dependencies** | `Core` (constants, types, base classes), `Utilities` (pure functions only) |
| **Forbidden Dependencies** | `Presentation`, `Application`, `Infrastructure`, `Platform`, `Shared` (no framework code, no Flutter imports, no `dart:io` imports) |

**Rationale**: The domain layer is pure Dart with zero framework dependencies. It can be extracted into a standalone Dart package and shared with backend services or desktop clients. Domain entities are immutable (via `freezed`) and self-validating.

---

### Layer 4: Infrastructure

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Provide concrete implementations of domain repository contracts by interfacing with external systems (APIs, databases, file systems, push services). |
| **Responsibilities** | • HTTP client wrappers (Dio interceptors, request/response logging, retry logic) • REST API data sources (mapping OpenAPI DTOs to domain entities) • WebSocket managers (connection lifecycle, reconnection, message framing) • SSE client (chat token stream consumption) • Drift database (SQLCipher tables, DAOs, migrations) • Secure storage adapter (JWT persistence, refresh token rotation) • Delta sync engine (timestamp anchoring, conflict resolution, queue flush) • Push notification handler (FCM/APNs token management, E2EE decryption) • Background worker registration (WorkManager task definitions) |
| **Allowed Dependencies** | `Domain` (implements its repository contracts), `Core`, `Utilities`, `Platform` (for native bridge access) |
| **Forbidden Dependencies** | `Presentation` (no widget references), `Application` (no use case imports — infrastructure is consumed by application, not the reverse) |

**Rationale**: Infrastructure is the adapter layer. Swapping from REST to GraphQL, or from Drift to Isar, requires changes only within this layer. All external library dependencies (`dio`, `drift`, `web_socket_channel`) are confined here.

---

### Layer 5: Platform

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Encapsulate platform-specific (iOS/Android) native capabilities behind Dart abstractions. |
| **Responsibilities** | • Biometric authentication (FaceID, TouchID, Android BiometricPrompt) • Secure Enclave / StrongBox KeyStore operations (key generation, signing, key release) • Connectivity monitoring (Wi-Fi, cellular, VPN status) • Device information (OS version, model, screen metrics, fold state) • Permission management (notification, camera for QR scan) • Haptic feedback engine • Deep link handler |
| **Allowed Dependencies** | `Core` (types, errors) |
| **Forbidden Dependencies** | `Presentation`, `Application`, `Domain`, `Infrastructure`, `Shared`, `Utilities` |

**Rationale**: Platform is the boundary between Dart and native code. It exposes abstract interfaces that infrastructure or application layers consume. This ensures platform-specific code is isolated and testable via mocks.

---

### Layer 6: Shared

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Provide cross-cutting reusable components that are feature-agnostic but may depend on framework classes. |
| **Responsibilities** | • Validators (email, hostname, port range, certificate PEM format) • Formatters (date/time, byte size, token count, duration) • Mixins (loading state mixin, error state mixin, lifecycle-aware mixin) • Generic converters (JSON serialization helpers, base64 encode/decode) • Pagination helpers (cursor-based, offset-based) |
| **Allowed Dependencies** | `Core`, `Utilities` |
| **Forbidden Dependencies** | `Presentation`, `Application`, `Domain`, `Infrastructure`, `Platform` |

**Rationale**: Shared code is reusable across all features but does not encode business rules. It is distinct from Utilities because it may reference framework types (e.g., `TextInputFormatter` from Flutter).

---

### Layer 7: Utilities

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Provide stateless, pure utility functions with zero side effects. |
| **Responsibilities** | • Date/time arithmetic (UTC conversion, relative time formatting) • String manipulation (truncation, sanitization, slug generation) • Cryptographic helpers (SHA-256 digest, HMAC computation, nonce generation) • Collection helpers (safe list access, deduplication, grouping) • Number formatting (percentage, compact notation) |
| **Allowed Dependencies** | `Core` (constants only) |
| **Forbidden Dependencies** | `Presentation`, `Application`, `Domain`, `Infrastructure`, `Platform`, `Shared` |

**Rationale**: Utilities are the most stable, most testable layer. They are pure functions that can be verified with simple input/output unit tests. No async, no state, no side effects.

---

### Layer 8: Core

| Attribute | Definition |
|-----------|-----------|
| **Purpose** | Define the foundational types, constants, error hierarchy, and configuration that every other layer depends on. |
| **Responsibilities** | • Application constants (API versions, timeout durations, retry limits, default intervals) • Base error/exception classes (the sealed `AppFailure` hierarchy) • Type aliases and typedefs • Logging interface (abstract logger contract) • Network configuration (base URLs, endpoint registry, header templates) • Guard types (type-safe route guard contracts) • Result type (`Either<Failure, Success>` or `sealed Result<T>`) |
| **Allowed Dependencies** | None (zero imports from other application layers) |
| **Forbidden Dependencies** | All other layers |

**Rationale**: Core is the absolute foundation. Changes to Core ripple to every other layer, so it must be the most stable and the most carefully reviewed. No third-party library imports except `dart:core` and `dart:typed_data`.

---

## 3.3 Dependency Matrix

```
                 Core  Utilities  Shared  Platform  Infrastructure  Domain  Application  Presentation
Core              ─       ✗         ✗        ✗           ✗            ✗         ✗            ✗
Utilities         ✓       ─         ✗        ✗           ✗            ✗         ✗            ✗
Shared            ✓       ✓         ─        ✗           ✗            ✗         ✗            ✗
Platform          ✓       ✗         ✗        ─           ✗            ✗         ✗            ✗
Domain            ✓       ✓         ✗        ✗           ✗            ─         ✗            ✗
Infrastructure    ✓       ✓         ✗        ✓           ─            ✓         ✗            ✗
Application       ✓       ✓         ✓        ✗           ✗            ✓         ─            ✗
Presentation      ✓       ✓         ✓        ✗           ✗            ✓         ✓            ─

✓ = Allowed dependency
✗ = Forbidden dependency
─ = Self
```

> **Enforcement**: This matrix is enforced via `import_lint` rules in `analysis_options.yaml` and a custom CI lint step that fails the build on any forbidden cross-layer import.

---

## 3.4 Dependency Rule Enforcement

### Static Analysis

```yaml
# analysis_options.yaml (excerpt)
analyzer:
  plugins:
    - import_lint

import_lint:
  rules:
    # Domain must not import infrastructure, presentation, or application
    - target: "lib/domain/**"
      disallow:
        - "lib/infrastructure/**"
        - "lib/presentation/**"
        - "lib/application/**"
        - "lib/platform/**"
        - "lib/shared/**"
        - "package:flutter/**"
        - "package:dio/**"
        - "package:drift/**"

    # Application must not import infrastructure or presentation
    - target: "lib/application/**"
      disallow:
        - "lib/infrastructure/**"
        - "lib/presentation/**"
        - "lib/platform/**"

    # Presentation must not import infrastructure or platform directly
    - target: "lib/presentation/**"
      disallow:
        - "lib/infrastructure/**"
        - "lib/platform/**"

    # Core must not import any other layer
    - target: "lib/core/**"
      disallow:
        - "lib/domain/**"
        - "lib/application/**"
        - "lib/infrastructure/**"
        - "lib/presentation/**"
        - "lib/platform/**"
        - "lib/shared/**"
        - "lib/utils/**"
        - "lib/features/**"
```

### CI Pipeline Gate

```bash
# Runs in CI on every PR
dart run import_lint
# Exit code 1 = forbidden import detected → PR blocked
```
