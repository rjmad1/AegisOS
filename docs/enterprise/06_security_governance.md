# Security Governance Framework

| Field | Value |
|---|---|
| **Document ID** | SGF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Internal — Security Standard |
| **Owners** | Security Architect / Compliance Architect |

---

## 1. STRIDE Threat Model

We analyze the system architecture against the STRIDE threat classification model:

| STRIDE Category | Threat Target | Threat Scenario | Technical Mitigation |
|---|---|---|---|
| **Spoofing** | User Authentication | Attacker intercepts session cookie to impersonate an administrator. | Cookies are signed with `jose` HS256, set as `HttpOnly`, `Secure`, and `SameSite=Strict`. |
| **Tampering** | Configuration & DB | Unauthorized local user modifies SQLite data file or config JSON. | Use Windows DPAPI for local secret encryption and encrypt config payloads in SQLite using AES-GCM. |
| **Repudiation** | Audit Pipeline | Administrator modifies or deletes audit logs to hide unauthorized changes. | Log entries are immutable, backed by DB triggers, and streamed to secure write-once-read-many (WORM) storage. |
| **Information Leak** | Artifacts Storage | Local agent writes corporate source files to a readable directory. | Enforce sandbox restrictions on tool executions, blocking directories outside `artifacts_storage/`. |
| **Denial of Service**| LLM Providers | Attacker floods inference API with requests, depleting system VRAM. | Implement rate limiting on API endpoints (100 requests/min) and configure max-token bounds. |
| **Elevation of Priv**| Role Check | Operator uses API manipulation to gain access to Admin routes. | Force server-side role validation in Next.js backend proxy middleware (role permissions matrix check). |

---

## 2. Data Classification

The platform categorizes data into three classification tiers:

1. **Restricted (Highly Sensitive)**: Cryptographic keys, API secrets, OAuth private client keys, and raw user conversation databases containing source code or PII. Encrypted at rest (AES-GCM-256) and in transit (mTLS/TLS 1.3).
2. **Internal**: Workstation configuration parameters, active schedules lists, capability registries, and system metrics histories. Restricted to authorized internal domain perimeters.
3. **Public**: Version details, platform documentation files, and open-source license manifests. Distributed freely.

---

## 3. Least Privilege & RBAC Matrix

We map system roles to permission scopes:

| Permission Scope | Administrator | Operator | Viewer | Auditor |
|---|---|---|---|---|
| `admin:write` (User CRUD, DB reset) | ✅ Yes | ❌ No | ❌ No | ❌ No |
| `config:write` (Modify environment settings) | ✅ Yes | ❌ No | ❌ No | ❌ No |
| `workflow:write` (Create, edit templates) | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| `workflow:execute` (Trigger, abort runs) | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| `logs:read` (View audit and system logs) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| `security:read` (View security state registry)| ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| `system:read` (View dashboard & telemetry) | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

*User permissions are checked server-side using the `hasPermission()` method in `src/repositories/user.repository.ts`.*

---

## 4. Supply Chain Security & SBOM

* **Software Bill of Materials (SBOM)**: The CI/CD pipeline automatically exports an SBOM in CycloneDX JSON format on every release build, cataloging all direct and transitive dependencies and hashes.
* **Dependency Review Policy**: Weekly automated scans via `npm audit` and vulnerability alerts (e.g. Snyk). Any dependency containing a vulnerability classified as HIGH or CRITICAL (CVSS >= 7.0) must be resolved or mitigated within 48 hours.
* **Container Security**: Base Docker images must be scanned for CVEs. Run only minimal distroless or Alpine base images containing zero unnecessary executables (like curl or ssh).

---

## 5. Integration Security: MCP and Plugin Models

```
   [Plugin / MCP execution request]
                  │
                  ▼
   [Gate 1: Schema Validation] ── (Verify request structures match JSON parameters)
                  │
                  ▼
   [Gate 2: Directory Check] ── (Block if path references /etc/ or user home dirs)
                  │
                  ▼
   [Gate 3: Process Sandboxing] ── (Execute tool inside isolated microVM or container)
```

* **MCP Security Model**: Model Context Protocol (MCP) servers run as decoupled subprocesses. Host perimeters enforce read-only variables, strict command path verification, and JSON-RPC schema sanitization.
* **Plugin Security Model**: Plugins are registered via `PlatformKernel.registerModule()` inside a JS try/catch sandbox. A crash in one module is caught at the kernel level and isolated, preventing it from taking down the main server process.

---

## 6. Incident Response & Security Runbooks

### Runbook 1: Compromised Credentials (OAuth Secret Leak)
1. **Revoke Client Credentials**: Immediately revoke the Client Secret on the Google API Console dashboard.
2. **Rotate Secrets**: Generate a new client secret, encrypt using DPAPI, and apply to `Secret` repository in the Admin Console.
3. **Terminate Sessions**: Invoke `logoutEverywhere()` in the authentication database to purge active sessions.
4. **Log Review**: Audit recent entries in the `AuditEvent` database to identify any unauthorized admin actions.

---

## 7. Compliance Mappings

Our security controls map to standard enterprise compliance frameworks:

| Compliance Control | SOC 2 Trust Services Criteria | ISO/IEC 27001 Control | NIST SP 800-218 (SSDF) | Technical Implementation |
|---|---|---|---|---|
| **Access Control** | CC6.1, CC6.2 | A.9.1, A.9.4 | PO.1.3 | RBAC role checks (`hasPermission`), HttpOnly secure session cookies. |
| **Data Encryption** | CC6.6, CC6.7 | A.8.2, A.18.1.2 | PW.3.1, PW.3.2 | AES-GCM database secrets storage, TLS 1.3 enforced by Caddy reverse proxy. |
| **Audit & Logging** | CC2.1, CC6.5 | A.12.4 | PO.3.1 | Immutable `AuditLogEntry` records and `AuditEvent` database entries. |
| **Supply Chain Security**| CC9.2 | A.15.1 | PW.4.1 | Automated CycloneDX SBOM generation and weekly dependency audits. |
| **Risk Management** | CC3.1, CC3.2 | A.12.6, A.18.2 | PO.2.1 | STRIDE threat model assessments and documented Risk Registers. |
