# AegisOS Studio Program (ASP)
## Module 07: Platform Consumption Matrix (Zero-Privilege Contract)

> **Status**: APPROVED  
> **Authority**: AegisOS Platform Architecture Council & API Governance Group  
> **Reference Document**: [00_Master_ASP_Framework.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/asp/00_Master_ASP_Framework.md)  

---

## 1. Zero-Privilege Consumption Mandate

AegisOS Studio consumes the AegisOS platform **strictly as a third-party client application**. It has:
- ❌ **NO direct database connections** (Prisma DB / SQLite direct file access prohibited).
- ❌ **NO privileged kernel IPC calls** or private OS process hooks.
- ❌ **NO special bypass permissions** or unauthenticated endpoints.
- ✅ **100% public REST API** interactions (`/api/v1/*`).
- ✅ **100% standard WebSocket event bus** streaming (`/ws/*`).
- ✅ **100% public Ecosystem SDK** integration (`@aegisos/sdk`).

---

## 2. Exhaustive UI Component to Public API Binding Matrix

| UI Component / Action | Interaction Trigger | Public API Endpoint / WS Channel | Method | Payload / Response |
| :--- | :--- | :--- | :--- | :--- |
| **Workspace Selector** | App launch / Switch WS | `/api/v1/workspaces` | `GET` | Array of Workspaces |
| **Create Workspace** | Modal submit | `/api/v1/workspaces` | `POST` | `{ name, path }` &rarr; Workspace Object |
| **Project Explorer Tree**| Expand folder | `/api/v1/projects/{id}/files` | `GET` | File tree nodes |
| **Open File / Editor** | Click file node | `/api/v1/projects/{id}/files/read` | `POST` | `{ path }` &rarr; File contents |
| **Ingest Directory / Docs**| Drag & Drop ingest | `/api/v1/knowledge/index` | `POST` | `{ uri, recursive: true }` |
| **Launch Mission** | Mission Form submit | `/api/v1/missions` | `POST` | `{ missionPackId, goal, hitlMode }` |
| **Mission Kanban Board** | Page load / Filter | `/api/v1/missions` | `GET` | List of Mission Summaries |
| **Live Agent Console** | Mission execution | `/ws/missions/{id}/telemetry` | `WS` | Event Stream (Thought, Tool, Output) |
| **HITL Gate Modal** | Gate event received | `/ws/missions/{id}/telemetry` | `WS` | Event: `HITL_REQUIRED` |
| **HITL Decision Submit** | Click Approve/Reject | `/api/v1/missions/{id}/hitl/respond` | `POST` | `{ gateId, decision, modifications }` |
| **Knowledge Graph View** | Page load / Search | `/api/v1/knowledge/graph` | `GET` | `{ nodes[], edges[] }` |
| **Global Search** | Type in `Cmd+K` | `/api/v1/search` | `POST` | `{ query, domainFilters[] }` |
| **Artifact Library** | Gallery load | `/api/v1/artifacts` | `GET` | List of Artifact Metadata |
| **Artifact Preview** | Click artifact tile | `/api/v1/artifacts/{id}` | `GET` | Artifact Content & Preview URL |
| **Extension Market** | Page load / Search | `/api/v1/extensions` | `GET` | Extension Registry Catalog |
| **Install Extension** | Click Install | `/api/v1/extensions/install` | `POST` | `{ packageId }` |
| **Capability Explorer** | Table load | `/api/v1/capabilities` | `GET` | Tool Schemas & Model Map |
| **Settings Update** | Form change | `/api/v1/settings` | `PUT` | Config JSON payload |

---

## 3. Security & Audit Verification

1. **Authentication**: All API requests attach bearer tokens issued by `/api/v1/auth/login`.
2. **Rate Limiting & Throttling**: Studio respects standard HTTP 429 response headers and backoff queues.
3. **Audit Log Traceability**: Every API invocation made by Studio carries a client correlation header `X-AegisOS-Studio-Session-ID` allowing unified tracing in platform operational logs.
