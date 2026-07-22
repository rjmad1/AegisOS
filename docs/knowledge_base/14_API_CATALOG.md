# AegisOS Knowledge Base: 14_API_CATALOG.md

## Primary REST API Endpoint Catalog

| Endpoint Route | Method | Description | Request Body / Parameters | Response Structure |
|---|---|---|---|---|
| `/api/v1/health` | GET | System health overview (Ollama, LiteLLM, GPU, Storage). | None | `{ status, modelAvailability, gpuStatus, storage, executionQueue }` |
| `/api/v1/system/autonomic-heal` | GET | Runs full diagnostic sweep across monitored services and triggers self-recovery. | None | `{ timestamp, overallStatus, services, actionsTaken }` |
| `/api/v1/system/autonomic-heal` | POST | Daemon lifecycle control (`action: "start" \| "stop" \| "heal"`). | `{ action: string, intervalMs?: number }` | `{ status, message, diagnostic?: object }` |
| `/api/v1/auth/saml` | GET | Initiates SAML 2.0 / Entra ID Single Sign-On flow. | `state`, `nonce` query params | HTTP 302 Redirect to IdP |
| `/api/v1/auth/callback` | POST/GET | Handles SAML response callback and maps group claims to RBAC roles. | `SAMLResponse` payload | Session Cookie + User Profile |
| `/api/v1/workflows` | POST | Triggers execution of database-backed Saga workflow graph. | `{ workflowId, inputs }` | `{ executionId, status, stepCheckpoints }` |
| `/api/v1/marketplace/packages` | GET/POST | Query or publish signed capabilities to local marketplace catalog. | Filter params or Package manifest | `{ packages: [...] }` or `{ packageId, status }` |
| `/api/v1/mobile/approvals` | POST | Mobile C2 biometric ECDSA signed command approval gate. | `{ commandId, signature, nonce }` | `{ approved: boolean, actionResult }` |
