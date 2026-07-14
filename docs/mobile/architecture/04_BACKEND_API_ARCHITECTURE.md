# §5 — Backend API Architecture

> **Document**: AegisOS Mobile — Backend API Architecture
> **Status**: DRAFT
> **Version**: 1.0.0

---

## 5.1 API Gateway Design

The mobile API surface is a **versioned extension** of the existing Next.js Console API (v1), exposed as a dedicated `/api/v2/mobile/` namespace. This avoids breaking existing web console consumers while providing mobile-optimized payloads.

### Gateway Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  NGINX / CADDY (TLS Termination + mTLS)                         │
│  ├── mTLS client certificate verification (mobile only)         │
│  ├── Rate limiting: 150 req/60s (IP-based)                     │
│  ├── Rate limiting: 300 req/60s (authenticated, token-bucket)  │
│  ├── Request size limit: 5MB                                    │
│  └── CORS: Origin allowlist (web console + mobile deep links)  │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────┐
│  NEXT.JS API LAYER                                              │
│  ├── /api/v1/...         Existing web console endpoints         │
│  ├── /api/v2/mobile/...  Mobile-optimized endpoints             │
│  ├── /ws/...             WebSocket endpoints                    │
│  └── /sse/...            Server-Sent Events endpoints           │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────▼───────────────────────────────────────┐
│  MIDDLEWARE PIPELINE                                             │
│  1. Request ID injection (X-Request-ID / correlation ID)        │
│  2. mTLS certificate extraction (CN → device_id)                │
│  3. JWT validation (signature + session DB check)                │
│  4. RBAC permission enforcement                                  │
│  5. Input validation (Zod schemas)                               │
│  6. Rate limit check (per-user, per-endpoint)                   │
│  7. Request logging (structured, redacted)                       │
└────────────────────────────────────────────────────────────────┘
```

---

## 5.2 Endpoint Architecture

### Controllers (Route Handlers)

| Controller | Endpoint Prefix | Responsibility |
|-----------|----------------|----------------|
| `AuthController` | `/api/v2/mobile/auth` | Device pairing, token exchange, biometric session, refresh, logout |
| `SyncController` | `/api/v2/mobile/sync` | Delta sync (pull changes since anchor), push pending actions |
| `TelemetryController` | `/api/v2/mobile/telemetry` | Telemetry snapshot (REST fallback), historical metrics query |
| `ChatController` | `/api/v2/mobile/chat` | Conversation CRUD, message send, model selection |
| `AgentController` | `/api/v2/mobile/agents` | Agent list, detail, control (pause/resume/kill), log query |
| `ApprovalController` | `/api/v2/mobile/approvals` | Pending queue, approve/reject with signed payload |
| `ModelController` | `/api/v2/mobile/models` | Model registry, pull, load/unload, delete, config |
| `KnowledgeController` | `/api/v2/mobile/knowledge` | Knowledge store list, search, trigger index |
| `InfraController` | `/api/v2/mobile/infrastructure` | Host topology, container status, service health |
| `MonitoringController` | `/api/v2/mobile/monitoring` | Metrics query, log query, alert list |
| `FileController` | `/api/v2/mobile/files` | Directory listing, file content, upload/download |
| `WorkflowController` | `/api/v2/mobile/workflows` | Workflow CRUD, execution control |
| `NotificationController` | `/api/v2/mobile/notifications` | Notification history, preferences, mark read |
| `DeviceController` | `/api/v2/mobile/devices` | Paired device registry, revoke, certificate status |
| `SettingsController` | `/api/v2/mobile/settings` | App configuration CRUD |
| `DiagnosticsController` | `/api/v2/mobile/diagnostics` | Connection test, health check, support bundle |

### WebSocket Endpoints

| Endpoint | Protocol | Purpose | Auth |
|----------|----------|---------|------|
| `/ws/telemetry` | WSS | Real-time GPU/VRAM/CPU metrics (5Hz LAN, 1Hz cellular) | mTLS + JWT |
| `/ws/agents/:agentId/logs` | WSS | Live agent execution log stream | mTLS + JWT |
| `/ws/approvals` | WSS | Real-time approval queue updates | mTLS + JWT |

### SSE Endpoints

| Endpoint | Protocol | Purpose | Auth |
|----------|----------|---------|------|
| `/sse/chat/:sessionId` | HTTPS/SSE | Streaming chat token response | mTLS + JWT |

---

## 5.3 Service Layer

```
┌──────────────────────────────────────────────────────────────────┐
│  SERVICE LAYER                                                    │
├──────────────────────────────────────────────────────────────────┤
│  AuthService          → Session management, JWT issuance, mTLS  │
│  DevicePairingService → QR payload generation, certificate      │
│                         exchange, device registration             │
│  SyncService          → Delta calculation, conflict resolution,  │
│                         anchor management                        │
│  TelemetryService     → Metric aggregation, snapshot creation,   │
│                         WebSocket broadcast                      │
│  ChatService          → Conversation management, prompt routing, │
│                         token stream orchestration                │
│  AgentService         → Agent lifecycle, control commands,        │
│                         log aggregation                          │
│  ApprovalService      → Queue management, signature verification,│
│                         auto-approval rule engine                 │
│  ModelService         → Registry queries, pull orchestration,     │
│                         VRAM allocation commands                  │
│  NotificationService  → E2EE payload encryption, FCM/APNs push, │
│                         notification persistence                  │
│  FileService          → MCP filesystem bridge, upload/download,  │
│                         diff generation                          │
│  WorkflowService      → Workflow engine bridge, execution        │
│                         lifecycle management                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5.4 Repository Layer

| Repository | Storage Backend | Responsibility |
|-----------|----------------|----------------|
| `SessionRepository` | PostgreSQL | Active sessions, device-session mapping |
| `DeviceRepository` | PostgreSQL | Paired device registry, certificates, last-seen timestamps |
| `ConversationRepository` | PostgreSQL | Chat sessions, messages, token metrics |
| `AgentRepository` | PostgreSQL + Redis | Agent instances, execution state, log indices |
| `ApprovalRepository` | PostgreSQL + Redis | Approval queue, signed responses, rule definitions |
| `TelemetryRepository` | Redis (hot) + PostgreSQL (cold) | Real-time metrics cache, historical snapshots |
| `ModelRepository` | Ollama API + PostgreSQL | Model registry cache, configuration overrides |
| `NotificationRepository` | PostgreSQL | Notification history, delivery status, preferences |
| `SyncAnchorRepository` | PostgreSQL | Per-device sync anchors, conflict log |
| `AuditRepository` | PostgreSQL | Immutable audit trail for all mobile actions |

---

## 5.5 Workers & Background Processing

| Worker | Queue | Trigger | Responsibility |
|--------|-------|---------|----------------|
| `SyncDeltaWorker` | `sync:delta` | Mobile sync request | Calculate delta payload from anchor timestamp |
| `PushNotificationWorker` | `push:send` | System event | Encrypt payload with device public key, dispatch to FCM/APNs |
| `ModelPullWorker` | `models:pull` | Mobile pull request | Orchestrate Ollama model download, report progress |
| `IndexingWorker` | `knowledge:index` | Manual trigger | Run document indexing pipeline, update search catalog |
| `CertificateRotationWorker` | `certs:rotate` | Scheduled (30-day) | Generate new certificates, notify paired devices |
| `AuditExportWorker` | `audit:export` | Admin request | Generate compliance audit report |

---

## 5.6 Event Bus

The existing AegisOS Event Bus (`event-bus.ts`) is extended with mobile-relevant event topics:

| Topic | Producer | Consumer(s) | Payload |
|-------|----------|-------------|---------|
| `device.paired` | AuthService | NotificationService, AuditService | `{ deviceId, fingerprint, timestamp }` |
| `device.revoked` | AdminService | NotificationService, SyncService | `{ deviceId, reason, timestamp }` |
| `approval.requested` | AgentRuntime | ApprovalService, PushNotificationWorker | `{ approvalId, agentId, command, riskLevel }` |
| `approval.resolved` | ApprovalService | AgentRuntime, AuditService | `{ approvalId, decision, signedPayload }` |
| `telemetry.snapshot` | TelemetryService | WebSocket Hub | `{ hostId, metrics, timestamp }` |
| `agent.state_changed` | AgentRuntime | WebSocket Hub, NotificationService | `{ agentId, oldState, newState }` |
| `model.pull_progress` | ModelPullWorker | WebSocket Hub | `{ modelName, bytesDownloaded, totalBytes }` |
| `sync.conflict` | SyncService | NotificationService | `{ deviceId, conflictType, resourceId }` |

---

## 5.7 WebSocket Hub

```
WebSocket Hub
├── Connection Manager
│   ├── Authenticate on upgrade (JWT + mTLS CN extraction)
│   ├── Register connection by deviceId + channel
│   ├── Heartbeat ping/pong (30s interval)
│   └── Graceful disconnect with reconnection token
├── Channel Manager
│   ├── telemetry    → Broadcast to all connected mobile clients
│   ├── agents       → Scoped to specific agentId subscriptions
│   ├── approvals    → Broadcast to all authenticated operators
│   └── models       → Broadcast pull progress events
├── Backpressure Control
│   ├── Message queue per connection (max 1000 messages)
│   ├── Drop oldest on overflow (telemetry)
│   └── Persist on overflow (approvals, agent state changes)
└── Metrics
    ├── Active connections count
    ├── Messages sent/sec
    └── Reconnection rate
```

---

## 5.8 Streaming Architecture

### SSE Chat Streaming

```
Mobile App                    Gateway                     AegisOS              LiteLLM           Ollama
    │                           │                           │                     │                 │
    │── POST /chat/send ───────▶│                           │                     │                 │
    │                           │── Forward prompt ────────▶│                     │                 │
    │                           │                           │── Enriched prompt ─▶│                 │
    │                           │                           │                     │── Inference ───▶│
    │                           │                           │                     │◀── Token ───────│
    │◀── SSE: data: {token} ───│◀── SSE forward ──────────│◀── SSE forward ─────│                 │
    │◀── SSE: data: {token} ───│◀── ...                    │                     │                 │
    │◀── SSE: data: [DONE] ────│◀── Stream complete ───────│                     │                 │
    │                           │                           │                     │                 │
    │── POST /chat/save ───────▶│                           │                     │                 │
    │                           │── Persist full message ──▶│                     │                 │
```

---

## 5.9 Authentication & Authorization

### Mobile Authentication Flow

```
1. QR Pairing (One-Time)
   Mobile scans QR → Extracts host public key + pairing token
   Mobile generates ECDSA keypair in Secure Enclave
   Mobile sends public key to host → Host registers device
   Host returns signed client certificate → Mobile stores in KeyStore

2. Session Establishment (Every Launch)
   Mobile opens mTLS connection (client cert in TLS handshake)
   Gateway extracts CN (device_id) from client cert
   Mobile sends biometric confirmation → Secure Enclave releases JWT signing key
   Mobile requests JWT via POST /auth/session (device_id + signed challenge)
   Gateway validates signature → Issues JWT (1h expiry) + Refresh Token (7d)

3. Token Refresh
   Mobile detects JWT expiry (5 min before)
   Mobile sends refresh token via POST /auth/refresh
   Gateway validates refresh token → Issues new JWT + rotates refresh token
   Old refresh token invalidated immediately

4. Request Authorization
   Every request carries: mTLS client cert + JWT in Authorization header
   Gateway verifies: cert CN matches JWT device_id claim
   Gateway checks: session exists in DB, not expired, not revoked
   Gateway enforces: RBAC permissions for the requested endpoint
```

### RBAC for Mobile Endpoints

| Role | Mobile Permissions |
|------|-------------------|
| `Administrator` | Full access to all mobile endpoints |
| `Operator` | Telemetry, agents, approvals, chat, models, monitoring |
| `Viewer` | Telemetry (read-only), monitoring (read-only), chat (read-only) |
| `Auditor` | Monitoring, audit logs, diagnostics |

---

## 5.10 Rate Limiting

| Tier | Scope | Limit | Window | Strategy |
|------|-------|-------|--------|----------|
| Global | Per IP | 150 requests | 60 seconds | Sliding window |
| Authenticated | Per device_id | 300 requests | 60 seconds | Token bucket |
| Chat | Per device_id | 10 messages | 60 seconds | Fixed window |
| Model Pull | Per device_id | 3 concurrent | — | Semaphore |
| WebSocket | Per device_id | 5 connections | — | Connection limit |
| Sync | Per device_id | 4 requests | 60 seconds | Fixed window |

---

## 5.11 API Versioning Strategy

### Approach: URI Path Versioning

| Version | Namespace | Status | Consumer |
|---------|-----------|--------|----------|
| `v1` | `/api/v1/` | Stable | Web Console (existing) |
| `v2` | `/api/v2/mobile/` | Active Development | Mobile App |

### Versioning Rules

1. **Breaking changes** require a new version (v3, v4, etc.)
2. **Additive changes** (new endpoints, new optional fields) are allowed within an existing version
3. **Deprecation period**: Minimum 6 months between deprecation announcement and version removal
4. **Sunset header**: Deprecated versions include `Sunset: <date>` response header
5. **Version negotiation**: Mobile app sends `X-AegisOS-Client-Version: 1.0.0` header for feature flag resolution

### Rationale for URI Versioning (vs. Header Versioning)

- **Clarity**: Every endpoint's version is visible in URL, debugging-friendly
- **Cacheable**: Reverse proxies can cache by path, not by header inspection
- **Simplicity**: No content negotiation complexity
- **Trade-off**: URL proliferation if many versions are active (mitigated by strict deprecation policy)
