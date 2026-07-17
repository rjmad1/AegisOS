# SDK Architecture & API Governance — AegisOS Developer Guide

| Field | Value |
|---|---|
| **Document ID** | SDK-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / SDK Standard |
| **Owner** | SDK Developer Experience Lead |

---

## 1. API Categorization

The AegisOS interface boundary is divided into three distinct layers to ensure security and prevent unauthorized access:

```
+------------------------------------------------------------+
|                        Public APIs                         |
|  - Available to external developer clients (REST, WSS)     |
+------------------------------------------------------------+
                              |
+------------------------------------------------------------+
|                       Extension APIs                       |
|  - Available to sandboxed plugins and local agents         |
+------------------------------------------------------------+
                              |
+------------------------------------------------------------+
|                       Internal APIs                        |
|  - System-level functions restricted to the Platform Kernel|
+------------------------------------------------------------+
```

### 1.1 Public APIs
* **Purpose**: Integrate client companion applications and external pipelines.
* **Access Path**: HTTPS / WSS endpoints (e.g., `/api/v1/workflows/run`).
* **Authentication**: OAuth 2.0 Access tokens.

### 1.2 Extension APIs
* **Purpose**: Allow plugins, skills, and agents to interact with the platform services (Event Bus, AI Runtime, DB Context).
* **Access Path**: Sandboxed global modules injected into runtime contexts (e.g., `aegis.eventBus.publish`).
* **Access Control**: Determined by the extension's `manifest.json` permissions array.

### 1.3 Internal APIs
* **Purpose**: Orchestrate low-level system services, process lifecycle hooks, and hardware scheduling.
* **Access Path**: Private TypeScript class interfaces restricted to Aegis Core packages.
* **Access Control**: Enforced by static code imports and circular dependency tracking.

---

## 2. Event and Error Contracts

### 2.1 Event Schema Standard
All messages flowing through the Event Bus are structured with unique identifiers, timestamps, and origin signatures:

```json
{
  "eventId": "evt_9876543210abcdef",
  "eventType": "workflow.execution.step_completed",
  "timestamp": "2026-07-17T02:00:00.123Z",
  "correlationId": "corr_1234567890abcdef",
  "origin": "workstation-node-01",
  "payload": {
    "workflowId": "wf_deploy_agent",
    "stepId": "step_02_verify_git",
    "status": "success",
    "durationMs": 450
  },
  "signature": "hmac-sha256-signature-hex-code"
}
```

### 2.2 Error Payload Standard
SDK errors return consistent error payloads, helping developers write resilient recovery logic:

```json
{
  "error": {
    "code": "INFERENCE_VRAM_EXHAUSTED",
    "message": "Target model RTX GPU memory allocation failed.",
    "correlationId": "corr_1234567890abcdef",
    "details": {
      "requestedModel": "llama3:70b",
      "availableVramMb": 4096,
      "requiredVramMb": 38900
    },
    "remediation": "Quantize model to GGUF format or route to a secondary node."
  }
}
```

---

## 3. Authentication & Authorization

All SDK client connections must pass authentication checks:
* **Token Operations**: Authenticated via OIDC (OpenID Connect) token flows. The SDK supports storing access tokens securely via Windows DPAPI (Data Protection API) or Unix Keyring.
* **Mutual TLS (mTLS)**: Node-to-node cluster communication requires mutual TLS verification, preventing unauthorized workstations from joining the event bus.
* **Authorization Checks**: Access to Core endpoints is audited using Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC). Users and API clients are mapped to standard roles:
  - `Administrator`: Complete write access.
  - `Developer`: Write access to workflows, templates, and plugins; read-only access to system configs.
  - `Operator`: Read-write access to system health, services management, and log telemetry.
  - `Audit`: Read-only access to security events and database logs.

---

## 4. Rate Limiting Rules

To prevent Denial of Service (DoS) attacks on local workstations, rate limiting is configured at the runtime gateway:

| Client Scope | Limit (Requests) | Window | Policy |
|---|---|---|---|
| **Public API Clients** | `120` | 60 Seconds | Sliding window; returns HTTP 429 |
| **Local Sandboxed Tools** | `500` | 60 Seconds | Local queue throttling |
| **Inference Routing Gate** | `5` concurrent models | N/A | Queue-based queuing with model swapping |

---

## 5. Developer Experience (DX)

* **Documentation Autogeneration**: Public APIs compile automatically into an OpenAPI v3 spec (`openapi-spec.json`) available in the `/docs` folder.
* **Local Emulator**: The SDK includes a local emulator mock server, letting developers test custom plugins and CLI scripts without requiring a physical GPU workspace.
* **Telemetry Diagnostics**: SDK calls carry correlation trace IDs, allowing developers to trace a client call down to local database queries, LiteLLM routing, and Ollama inference steps.
