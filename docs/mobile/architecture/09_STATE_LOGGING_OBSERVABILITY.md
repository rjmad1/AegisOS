# §11 — State Management

> **Document**: AegisOS Mobile — State Management, Error Handling, Logging & Observability
> **Status**: DRAFT
> **Version**: 1.0.0
> **Last Updated**: 2026-07-13

---

## 11.1 Framework Selection: Riverpod

### Recommendation

**Riverpod 2.x** (specifically utilising the code generation package `riverpod_generator`) is the recommended state management solution for AegisOS Mobile.

### Alternatives Considered

| Framework | Considered | Verdict |
|-----------|------------|---------|
| **Riverpod** | ✅ Selected | Best compile-time safety, seamless provider scoping, automatic clean-up (autodispose), and testability. |
| **BLoC (Business Logic Component)** | ❌ Rejected | High boilerplate overhead, strict event-state stream mapping is too heavy for simple operations, and less natural for reactive UI bindings in small-to-medium widgets. |
| **Redux** | ❌ Rejected | Extreme boilerplate, single global store becomes a bottleneck in modular multi-threaded apps, and lacks native Flutter lifecycle integration. |
| **MobX** | ❌ Rejected | Relies heavily on mutable state and complex code generation runners, making tracing asynchronous state mutation flow difficult. |
| **Provider** | ❌ Rejected | Inherently tied to the widget tree (leads to runtime `ProviderNotFoundException`), lacks compile-time safety, and cannot cleanly decouple business logic from BuildContext. |

### Rationale

1. **Compile-Time Safety**: Riverpod resolves dependency graphs at compile time, eliminating runtime provider lookup failures.
2. **Auto-Dispose and Memory Management**: Telemetry screens consume high-frequency data streams (5Hz). Riverpod automatically disposes of active providers, controllers, and streams when a screen is closed, preventing memory leaks and unnecessary network usage.
3. **Isolate and Background compatibility**: Riverpod providers can be consumed inside background workers or separate Dart Isolates since they do not depend on the Flutter widget tree.
4. **Decoupled Unit Testing**: Business logic written inside Riverpod `Notifier` classes can be tested in pure Dart tests by mocking provider dependencies.

### Trade-offs

| Advantage | Disadvantage |
|-----------|-------------|
| Eliminates runtime provider lookup exceptions | Requires running code generation (`build_runner`) during development |
| Native support for asynchronous state (`AsyncValue`) | Steeper learning curve for developers coming from React Native / Redux |
| Built-in caching, pull-to-refresh, and debounce | Frequent updates to Riverpod packages might introduce minor API churn |

### Implementation Complexity

**Low-Medium**. Code generation significantly reduces boilerplate. The team must align on provider patterns (e.g., using `FutureProvider` for API calls, `Notifier` for state manipulation, and `StateProvider` for simple UI toggles).

### Future Scalability

As AegisOS Mobile expands to support multiple hosts, Riverpod's scoping allows the entire state of a feature module to be duplicated for different active hosts.

### Migration Impact

None. Greenfield implementation.

---

## 11.2 State Flow and Architecture

State flows strictly in a unidirectional loop matching clean architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER                    │
│  ┌──────────────────┐           ┌────────────────────────┐  │
│  │   UI Widget      │──────────▶│ Riverpod AsyncNotifier │  │
│  │  (Reads State)   │           │ (Dispatches Action)    │  │
│  └──────────────────┘           └───────────┬────────────┘  │
└──────────▲──────────────────────────────────│───────────────┘
           │                                  │
           │ (State Update: AsyncValue)       │ (Executes Use Case)
           │                                  ▼
┌──────────┴──────────────────────────────────────────────────┐
│                       APPLICATION LAYER                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  UseCase Command / Query              │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────│───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN LAYER                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             Abstract Repository Contract              │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────│───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │          Concrete Repository Implementation           │  │
│  │    (Queries SQLCipher Cache, REST API, or WebSocket)  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

# §12 — Error Handling

## 12.1 Global Exception Strategy

AegisOS Mobile implements a **Zero Crash policy**. All exceptions must be caught at the boundaries (Infrastructure or Presentation) and translated into typed failures before updating the UI state.

```
                  UNHANDLED CRITICAL EXCEPTION
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     Dart VM Exception                      Flutter Engine
            │                                     │
    ┌───────▼─────────────────────────────────────▼───────┐
    │              Zone-Guided Error Catcher              │
    │  • Capture stack trace                              │
    │  • Check Redaction Policy (mask tokens, passwords)  │
    │  • Write to SQLCipher diagnostic log                │
    │  • Dispatch telemetry audit report                 │
    └──────────────────────┬──────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            ▼                             ▼
    App in Foreground             App in Background
    Show UI Toast/Dialog          Generate System Notification
```

---

## 12.2 Typed Failure Hierarchy

Every infrastructure request returns an `Either<Failure, Success>` wrapper (or a sealed `Result` type), categorising failures into domain-specific states:

```
                           [Failure]
                               │
      ┌────────────────────────┼────────────────────────┐
      ▼                        ▼                        ▼
[NetworkFailure]       [DatabaseFailure]       [SecurityFailure]
  ├── Timeout            ├── EncryptionKey       ├── InvalidPairing
  ├── ConnectionLost     ├── WriteBlocked        ├── TokenExpired
  ├── ServerDegraded     └── CorruptedFile       └── AccessDenied
```

---

## 12.3 Recovery and Retry Actions

| Error Code | Detection Mechanism | Immediate Action | Recovery Strategy | User Messaging |
|------------|---------------------|------------------|-------------------|----------------|
| **Network Timeout** | Connection handshake fails after 10s | Add action to `pending_actions_queue` | Attempt connection retry via exponential backoff. Transition UI indicator to "Reconnecting...". | "Connection timed out. Retrying in background." |
| **Expired Token** | API returns `HTTP 401 Unauthorized` | Trigger `RefreshTokenUseCase` | Use refresh token in secure storage to request new JWT. If successful, replay original request. | No UI disruption (silent recovery). |
| **Invalid/Revoked Token** | Refresh token fails with `HTTP 403` | Wipe session JWTs; preserve pairing | Navigate user back to the Biometric Unlock screen. | "Session expired. Please authenticate using FaceID/Fingerprint." |
| **Host Revocation** | TLS handshake rejected by host mTLS | Immediately purge memory; trigger self-wipe | Erase SQLCipher database and KeyStore configuration. Return app to unpaired state. | "This device has been disconnected by the workstation administrator." |
| **Database Corruption** | SQLCipher throws database open error | Purge corruption; trigger re-pair | Force-delete the SQLCipher file, rebuild schema, and request the user scan the pairing QR code again. | "Database integrity check failed. Please re-pair your device." |

---

# §13 — Logging

## 13.1 Architecture

```
                  LOG EVENTS (All Modules)
                             │
                             ▼
                 [Redaction Log Interceptor]
                 • Mask JWT tokens & passwords
                 • Redact absolute file system paths
                 • Filter PII (emails, names)
                             │
                             ▼
                   [Aegis Logger Router]
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
       System Console     Drift DB       SRE Telemetry
         (Dev Only)      (SQLCipher)     (OpenTelemetry)
```

---

## 13.2 Log Classifications

| Log Level | Type | Output Target | Redaction Scope | Retention |
|-----------|------|---------------|-----------------|-----------|
| **Debug** | Application trace | Console (Dev only) | None | Transient |
| **Info** | Navigation, model load, sync status | SQLCipher `diagnostic_log` | IP addresses masked | 3 days |
| **Warning**| Network timeouts, cache evictions | SQLCipher `diagnostic_log` | Server URLs redacted | 7 days |
| **Error** | Database query fail, SSE disconnection | SQLCipher `diagnostic_log` | Stack traces stripped of variables | 14 days |
| **Critical**| Biometric fail lockout, remote wipe | SQLCipher + Telemetry API | Strictly no variables, hashes only | 30 days |
| **Audit** | Human-in-the-loop decisions | SQLCipher `audit_log` | Payload signed with device key | Infinite |

---

## 13.3 Redaction Policy

Before any log is printed to console or written to database, the `LogRedactor` middleware filters all strings using compiled regular expressions:

```dart
// Conceptual - Redactor Rules
final redactionRules = {
  RegExp(r'(jwt|token|password|auth_secret)\s*:\s*[^\s,]+', caseSensitive: false): r'$1: [REDACTED_SECURE]',
  RegExp(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'): '[REDACTED_PII]',
  RegExp(r'[a-zA-Z]:\\[\\\w\s-]*\.\w+|\/[a-zA-Z0-9_\-\.\/]+'): '[REDACTED_PATH]'
};
```

---

# §14 — Observability

## 14.1 Metrics & Telemetry Pipeline

Observability on mobile is designed to monitor device health, app responsiveness, and sync queue performance. Telemetry is collected locally and pushed to the workstation's **OpenTelemetry Collector** (ports 4317/4318) when online.

```
       APP EVENTS & METRICS (UI/DB/Sync)
                       │
                       ▼
         [OpenTelemetry Dart SDK]
         ├── Resource: aegis-mobile-app
         ├── Tracer: trace-sync-engine
         └── Meter: metrics-database
                       │
                       ▼
          [OTel Exporter Interface]
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
      (Online)                  (Offline)
  Push to Workstation     Buffer in SQLCipher
  OTel Collector          Outbox Table
```

---

## 14.2 Key Performance Indicators (KPIs)

The following metrics are collected continuously and exported to the workstation's Prometheus instance:

| Metric Name | Type | Unit | Description | Target |
|-------------|------|------|-------------|--------|
| `aegis_app_start_duration` | Gauge | Milliseconds | Time from app invocation to UI interaction | `< 400ms` |
| `aegis_sync_duration` | Histogram | Seconds | Duration of a delta sync execution | `< 0.5s` |
| `aegis_db_query_duration` | Histogram | Milliseconds | Time taken to query SQLCipher | `< 15ms` |
| `aegis_ui_frame_jitter` | Counter | Frames | Counts dropped frames (>16.6ms) during rendering | `< 2%` of frames |
| `aegis_queue_backlog` | Gauge | Count | Number of pending actions waiting to sync | `0` (ideal) |
| `aegis_battery_drain` | Gauge | % / Hour | Hourly battery drain during background sync | `< 2% / hour` |
| `aegis_token_render_latency`| Histogram | Milliseconds | Time from SSE token packet receipt to screen redraw | `< 30ms` |
