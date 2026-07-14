# §2 — Mobile Architecture

> **Document**: AegisOS Mobile — Mobile Architecture Blueprint
> **Status**: DRAFT
> **Version**: 1.0.0

---

## 2.1 Framework Selection: Flutter

### Recommendation

**Flutter 3.x (Dart)** is the recommended mobile framework for AegisOS Mobile.

### Alternatives Considered

| Framework | Considered | Verdict |
|-----------|-----------|---------|
| **Flutter** | ✅ Selected | Best balance of performance, native API access, and single-codebase efficiency |
| **React Native** | ❌ Rejected | JSI bridge overhead for real-time telemetry; weaker iOS Secure Enclave bindings; larger dependency surface |
| **Kotlin Multiplatform** | ❌ Rejected | Immature UI toolkit (Compose Multiplatform still maturing on iOS); requires platform-specific UI layers |
| **Native (Swift + Kotlin)** | ❌ Rejected | Double engineering cost; inconsistent feature parity; requires two specialized teams |
| **MAUI (.NET)** | ❌ Rejected | Poor mobile ecosystem maturity; limited community; minimal security library ecosystem |

### Rationale

1. **Native Performance**: Flutter compiles to ARM native code via AOT. No JavaScript bridge. Critical for 60fps telemetry rendering and sub-30ms token display latency (NFR-1.1, NFR-1.2).

2. **Secure Enclave / KeyStore Access**: Flutter Platform Channels provide direct access to iOS Secure Enclave and Android KeyStore for ECDSA keypair generation and SQLCipher key derivation — required for mTLS and HITL cryptographic signatures (PDR-04, PDR-05).

3. **Single Codebase, Adaptive UI**: Flutter's `LayoutBuilder`, `MediaQuery`, and Material 3 adaptive components enable the compact/medium/expanded grid system specified in the PRD without separate codebases.

4. **Dart Language Safety**: Sound null safety, strong typing, and `sealed class` pattern matching eliminate entire categories of runtime errors. The `freezed` code generation library enables immutable domain models aligned with Clean Architecture.

5. **Open-Source Alignment**: Flutter is BSD-3 licensed, compatible with AegisOS's MIT license. No proprietary runtime dependencies.

6. **Background Processing**: Flutter supports both Android WorkManager and iOS BGTaskScheduler via the `workmanager` package, enabling the 15-minute background sync interval specified in the Synchronization Strategy.

### Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Single codebase for iOS, Android, tablet, foldable | Smaller talent pool than React Native |
| AOT compilation → native performance | Dart ecosystem smaller than JavaScript/TypeScript |
| Strong typing with sound null safety | Platform channel bridging requires Swift/Kotlin knowledge |
| Material 3 + Cupertino widget libraries | Initial app binary size (~15MB baseline) |
| Hot reload for rapid development | Cannot reuse existing Next.js TypeScript code directly |

### Implementation Complexity

**Medium**. Core framework is mature. Platform channel development for Secure Enclave and mTLS requires iOS/Android native experience. Estimated: 1 senior Flutter engineer + 1 platform specialist.

### Future Scalability

Flutter supports desktop (macOS, Windows, Linux) and web compilation. A future AegisOS desktop companion or PWA can share 80%+ of the Flutter codebase.

### Migration Impact

None — greenfield project. No existing mobile codebase to migrate.

---

## 2.2 Project Folder Structure

```
aegis_mobile/
├── android/                          # Android platform host
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── kotlin/.../           # Platform channel implementations
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle.kts
│   └── build.gradle.kts
├── ios/                              # iOS platform host
│   ├── Runner/
│   │   ├── AppDelegate.swift
│   │   ├── SecureEnclaveChannel.swift
│   │   └── Info.plist
│   └── Podfile
├── lib/                              # Dart source root
│   ├── main.dart                     # Entry point
│   ├── main_dev.dart                 # Dev flavor entry
│   ├── main_staging.dart             # Staging flavor entry
│   ├── main_prod.dart                # Production flavor entry
│   ├── bootstrap.dart                # DI container initialization
│   │
│   ├── core/                         # §2.3 Core module
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── extensions/
│   │   ├── guards/
│   │   ├── logging/
│   │   ├── network/
│   │   └── types/
│   │
│   ├── config/                       # App configuration
│   │   ├── env/
│   │   ├── routes/
│   │   └── theme/
│   │
│   ├── domain/                       # §3 Domain layer
│   │   ├── entities/
│   │   ├── enums/
│   │   ├── failures/
│   │   ├── repositories/             # Abstract repository contracts
│   │   └── value_objects/
│   │
│   ├── application/                  # §3 Application layer (use cases)
│   │   ├── auth/
│   │   ├── sync/
│   │   ├── agents/
│   │   └── ...per feature
│   │
│   ├── infrastructure/               # §3 Infrastructure layer
│   │   ├── api/                      # HTTP clients, interceptors
│   │   ├── database/                 # Drift (SQLCipher) tables, DAOs
│   │   ├── secure_storage/           # Secure Enclave / KeyStore wrapper
│   │   ├── sync/                     # Delta sync engine
│   │   ├── push/                     # Push notification handler
│   │   ├── websocket/                # WebSocket manager
│   │   ├── sse/                      # SSE client
│   │   └── background/               # WorkManager / BGTask bridges
│   │
│   ├── platform/                     # §3 Platform layer
│   │   ├── biometric/
│   │   ├── connectivity/
│   │   ├── device_info/
│   │   ├── permissions/
│   │   └── secure_enclave/
│   │
│   ├── presentation/                 # §3 Presentation layer
│   │   ├── design_system/            # §10 Design tokens, widgets
│   │   │   ├── tokens/
│   │   │   ├── atoms/
│   │   │   ├── molecules/
│   │   │   └── organisms/
│   │   ├── navigation/
│   │   └── shared_widgets/
│   │
│   ├── features/                     # §4 Feature modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── mission_control/
│   │   ├── chat/
│   │   ├── agents/
│   │   ├── approvals/
│   │   ├── models/
│   │   ├── knowledge/
│   │   ├── infrastructure/
│   │   ├── monitoring/
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── files/
│   │   ├── search/
│   │   ├── voice/
│   │   ├── workflows/
│   │   ├── automation/
│   │   ├── remote_control/
│   │   ├── administration/
│   │   ├── developer_mode/
│   │   └── diagnostics/
│   │
│   ├── shared/                       # Cross-feature shared code
│   │   ├── mixins/
│   │   ├── validators/
│   │   └── formatters/
│   │
│   └── utils/                        # Pure utility functions
│       ├── date_utils.dart
│       ├── string_utils.dart
│       └── crypto_utils.dart
│
├── test/                             # §15 Test directory (mirrors lib/)
│   ├── unit/
│   ├── widget/
│   ├── integration/
│   ├── golden/
│   └── fixtures/
│
├── integration_test/                 # On-device integration tests
│
├── assets/                           # Static assets
│   ├── fonts/
│   ├── icons/
│   ├── images/
│   └── animations/                   # Lottie / Rive animations
│
├── l10n/                             # Localization
│   ├── app_en.arb
│   └── app_es.arb
│
├── scripts/                          # Build & CI scripts
│   ├── build_runner.sh
│   ├── generate_coverage.sh
│   └── golden_update.sh
│
├── analysis_options.yaml             # Dart lint rules
├── pubspec.yaml                      # Dependencies
├── pubspec.lock
├── build.yaml                        # build_runner configuration
├── dart_test.yaml                    # Test configuration
└── README.md
```

---

## 2.3 Package Organization Strategy

### Rationale: Vertical Slice + Layered Hybrid

The structure uses **vertical feature slicing** (each feature is self-contained under `features/`) combined with **horizontal shared layers** (`domain/`, `infrastructure/`, `core/`). This hybrid approach ensures:

- Features can be developed in parallel without merge conflicts
- Shared domain models are defined once and consumed by all features
- Infrastructure implementations can be swapped without touching features

### Feature Module Internal Structure

Each feature under `features/<name>/` follows a consistent internal layout:

```
features/<name>/
├── data/                             # Feature-specific data sources
│   ├── datasources/
│   ├── models/                       # DTOs, API models
│   └── repositories/                 # Concrete repository implementations
├── domain/                           # Feature-specific domain (if needed)
│   ├── entities/
│   ├── repositories/                 # Abstract contracts
│   └── usecases/
├── presentation/
│   ├── pages/
│   ├── widgets/
│   ├── controllers/                  # Riverpod providers / notifiers
│   └── state/                        # Feature-specific state classes
└── <name>.dart                       # Barrel export file
```

### Alternatives Considered

| Strategy | Verdict |
|----------|---------|
| Pure layer-first (`lib/data/`, `lib/domain/`, `lib/presentation/`) | Rejected: Leads to 200+ file directories; poor discoverability; cross-feature coupling |
| Pure feature-first (no shared layers) | Rejected: Code duplication for shared entities; inconsistent API client patterns |
| Monorepo with `melos` packages | Rejected for v1: Premature complexity. Migrate to melos packages in v2 if team grows past 5 engineers |

---

## 2.4 Dependency Injection

### Recommendation: Riverpod (Code Generation Mode)

**Riverpod 2.x with `riverpod_generator`** is the recommended DI and service locator framework.

### Rationale

1. **Compile-time Safety**: Riverpod providers are resolved at compile time. No runtime `GetIt.I<T>()` lookups that can throw if not registered.
2. **Scoped Overrides**: Providers can be scoped to features or overridden in tests without global mutation.
3. **Autodispose**: Providers can auto-dispose when no longer listened to, preventing memory leaks from retained WebSocket connections or large telemetry buffers.
4. **Code Generation**: `@riverpod` annotations generate boilerplate, reducing manual provider declaration.

### Alternatives Considered

| Framework | Verdict |
|-----------|---------|
| `get_it` + `injectable` | Rejected: Runtime service locator; no autodispose; requires manual lifecycle management |
| `provider` | Rejected: Lacks compile-time safety; context-dependent lookups; inheritance limitations |
| Manual constructor injection | Rejected: Unscalable for 20+ feature modules; no autodispose |

### DI Container Bootstrap

```
bootstrap.dart
├── Register infrastructure providers (HTTP client, DB, SecureStorage)
├── Register platform providers (Biometric, Connectivity)
├── Feature providers auto-registered via @riverpod annotations
└── Environment-specific overrides injected via ProviderScope
```

---

## 2.5 Navigation

### Recommendation: `go_router` with Type-Safe Routes

### Rationale

1. **Declarative Routing**: Routes defined as a tree structure, matching the Information Architecture hierarchy.
2. **Deep Link Support**: Native `uawos://` scheme registration for deep linking from push notifications and IDE plugins.
3. **Guard Support**: `redirect` guards enable auth-gate (biometric check), pairing-gate (must be paired before accessing features), and role-gate (admin-only screens).
4. **Adaptive Navigation**: Shell routes with `StatefulShellRoute` support bottom tabs (compact), navigation rail (medium/expanded), and drawer (overflow) simultaneously.
5. **Type-Safe Path Parameters**: `go_router_builder` generates typed route helpers, eliminating string-based path errors.

### Route Hierarchy

```
/                                    → Splash / Auth Gate
├── /pair                            → QR Pairing Flow
├── /auth/biometric                  → Biometric Unlock
├── /shell                           → Main Shell (Bottom Tabs / Nav Rail)
│   ├── /shell/mission-control       → Tab 1: Mission Control
│   ├── /shell/chat                  → Tab 2: AI Assistant
│   │   └── /shell/chat/:sessionId   → Active Conversation
│   ├── /shell/approvals             → Tab 3: HITL Queue
│   │   └── /shell/approvals/:id     → Approval Detail
│   ├── /shell/agents                → Tab 4: Agent Control Room
│   │   └── /shell/agents/:agentId   → Agent Inspector
│   └── /shell/monitoring            → Tab 5: Telemetry
│       └── /shell/monitoring/:host  → Host Detail
├── /models                          → Model Manager
├── /knowledge                       → Knowledge Browser
├── /files                           → File Browser
├── /workflows                       → Workflow Editor
├── /search                          → Global Command Palette
├── /settings                        → Settings
│   ├── /settings/security           → Security Config
│   ├── /settings/devices            → Paired Devices
│   └── /settings/developer          → Developer Mode
└── /diagnostics                     → App Diagnostics
```

---

## 2.6 State Management

> Full analysis in §11.

**Recommendation**: Riverpod 2.x (detailed trade-off analysis in §11).

---

## 2.7 Offline Storage

### Recommendation: Drift ORM + SQLCipher

> Full analysis in §7.

**Strategy**: Drift (type-safe SQLite ORM) backed by SQLCipher for AES-256-GCM encryption at rest. The encryption key is derived from the device Secure Enclave / KeyStore and released only after biometric authentication.

---

## 2.8 Secure Storage

| Storage Type | Implementation | Use Case |
|-------------|---------------|----------|
| **Secrets** | `flutter_secure_storage` (backed by iOS Keychain / Android EncryptedSharedPreferences) | JWT tokens, refresh tokens, session IDs |
| **Crypto Keys** | Platform Channel → Secure Enclave (iOS) / StrongBox KeyStore (Android) | ECDSA private key for mTLS, SQLCipher key, HITL signing key |
| **Encrypted DB** | Drift + SQLCipher | Conversation cache, telemetry snapshots, pending actions queue |
| **Ephemeral** | In-memory only (Dart objects) | Decrypted file diffs, raw telemetry frames, token buffers |

### Key Lifecycle

```
App Launch → Biometric Prompt → Secure Enclave releases DB key
  → SQLCipher database opened → Providers initialized
  → App Backgrounded (>30s) → DB key purged from memory
  → App Resumed → Biometric Prompt → Key re-derived
```

---

## 2.9 Background Workers

### Platform-Specific Bridges

| Platform | Technology | Flutter Package |
|----------|-----------|----------------|
| Android | WorkManager (Jetpack) | `workmanager` |
| iOS | BGTaskScheduler (BGAppRefreshTask) | `workmanager` |

### Scheduled Tasks

| Task | Interval | Constraints | Payload |
|------|----------|-------------|---------|
| Delta Sync | 15 min (default), 60 min (low battery) | Wi-Fi or VPN connected, battery > 20% | Sync conversations, telemetry snapshots, HITL queue |
| Push Token Refresh | 24 hours | Network available | Re-register FCM/APNs device token with host |
| Certificate Rotation Check | 7 days | Network available | Check if client certificate is nearing expiry |
| Offline Queue Flush | On connectivity change | Network restored | Flush `pending_actions_queue` to host |

### Alternatives Considered

| Approach | Verdict |
|----------|---------|
| Dart `Isolate` with `Timer` | Rejected: Killed when app is terminated; no OS-level guarantee |
| Platform-specific native services | Rejected: Double implementation cost; Flutter `workmanager` package handles both |
| Firebase Cloud Functions trigger | Rejected: Violates local-first principle; introduces cloud dependency |
