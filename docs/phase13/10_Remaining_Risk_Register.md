# Remaining Risk Register — OpenClaw V1.0

| Field | Value |
|---|---|
| **Document ID** | RRR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Restricted — Risk Governance |

---

## 1. Risk Governance Overview

This register lists the remaining risks, security gaps, and operational limitations identified during the V1.0 Enterprise Validation program. All items are mapped to Severity, Likelihood, and Impact levels, and include actionable mitigation strategies for the enterprise control plane.

### Risk Rubric

* **Severity / Impact**: Critical, High, Medium, Low.
* **Likelihood**: High (expected), Medium (possible), Low (unlikely).

---

## 2. Risk Ledger

| Risk ID | Risk Description | Severity | Likelihood | Impact | Proposed Mitigation Strategy |
|---|---|---|---|---|---|
| **RISK-01** | **Elevated Service Privilege Execution**<br>Windows NSSM services run under the LocalSystem account. A compromise of Next.js or Python gateways exposes administrative privileges on the host. | **High** | Low | High | **Configure Scoped User Service Logon**: Create a dedicated restricted Windows user account (`AI_Service_User`) and update the SCM logon parameter for the OpenClaw, LiteLLM, and Ollama services. |
| **RISK-02** | **Vulnerable Transitive Dependencies**<br>npm audit identifies vulnerabilities in `dompurify` (v3.4.10 and below) used by `monaco-editor`. | **Medium** | Low | Medium | **Override package.json paths**: Explicitly declare resolved version overrides in package.json or configure build-time sanitizers to strip active scripts. |
| **RISK-03** | **SQLite Database Concurrent Locking**<br>Parallel execution writes during highly concurrent workflow execution runs can trigger database write blocks (`SQLITE_BUSY`). | **Medium** | Medium | Medium | **Migrate to external PostgreSQL**: For production environments with multi-user concurrency, set the `DATABASE_URL` to an external PostgreSQL instance. |
| **RISK-04** | **Unauthenticated Downstream Ollama Binding**<br>The Ollama inference engine does not support native endpoint authentication. If port 11434 is mapped to external network adapters, anyone on the LAN can access model weights. | **High** | Medium | High | **Loopback Interface Binding**: Ensure Ollama is explicitly bound only to localhost loopback `127.0.0.1`. Apply Windows Firewall rules restricting access to the port. |
| **RISK-05** | **Lack of Real-Time WebSocket Push**<br>Real-time event updates in the admin dashboard rely on REST API polling rather than persistent WebSocket connections, leading to UI sync delays. | **Low** | High | Low | **WebSocket Bridge Integration**: Introduce an SSE (Server-Sent Events) or WebSocket bridge in the Gateway to stream telemetry live to the browser. |
| **RISK-06** | **Local Session Cookie Lifetime Duration**<br>Session tokens are stored in cookies with an 8-hour expiration. An attacker obtaining the cookie can hijack the session until absolute expiration (12h). | **Medium** | Low | Medium | **Reduce Expiration & Enforce IP Binding**: Lower session lifetime to 2 hours and check user IP matches the original session-initiating IP inside `proxy.ts`. |
| **RISK-07** | **No Automated Log Rotation for EventBus Logs**<br>`event_audit.json` grows indefinitely, exposing the disk to exhaustion over months of continuous operation. | **Low** | Medium | Low | **Scheduled Cleanup Job**: Configure a script or scheduler job in the platform (`self-healer.ts`) to truncate or archive older event log records. |
| **RISK-08** | **Lack of Enterprise Single Sign-On (SSO)**<br>Google Login is the only supported identity provider. Enterprises utilizing Okta, Azure AD, or PingFederate cannot integrate native directories. | **Medium** | Medium | Medium | **SAML 2.0 / OIDC Adapters**: Add generic OpenID Connect adapter configurations in V1.1. |
