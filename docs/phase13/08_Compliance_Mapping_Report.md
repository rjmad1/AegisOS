# Compliance Mapping Report — AegisOS V1.0

| Field | Value |
|---|---|
| **Document ID** | CMR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Internal — Enterprise Compliance |

---

## 1. Executive Summary & Disclaimer

This report provides a high-level mapping of AegisOS V1.0's features and architecture against leading enterprise security frameworks. This mapping demonstrates the platform's alignment with cybersecurity best practices.

> [!WARNING]
> **DISCLAIMER**: This document is an internal compliance mapping for validation purposes only. It does not constitute formal certification or accreditation by any audit body, registrar, or regulatory authority.

**Overall Verdict: ALIGNED WITH GAPS**
The platform's local-first architecture aligns with data privacy and sovereignty regulations. Gaps exist primarily in enterprise environments where centralized logging, centralized user directories (LDAP/AD), and multi-tenant isolation are required.

---

## 2. Compliance Mapping Frameworks

### 2.1 OWASP Top 10 (2021) Mapping

| OWASP Category | Platform Alignment / Controls | Status / Gaps |
|---|---|---|
| **A01:2021-Broken Access Control** | Explicit RBAC permission checks (`RolePermissions` in `authorization.ts`); Route validation in `proxy.ts`. | **Aligned**. Route-level RBAC is strictly enforced. |
| **A02:2021-Cryptographic Failures** | Cookies signed with cryptographically secure key; Secrets stored using Windows DPAPI and AES-GCM. | **Aligned**. No plaintext secrets are saved on disk. |
| **A03:2021-Injection** | Parameterized SQL queries via Prisma ORM; prompt regex scanning in `policy-enforcer.ts`. | **Aligned**. Parameterization blocks SQL Injection. |
| **A04:2021-Insecure Design** | Strict CORS configurations, clickjacking defense (`X-Frame-Options: DENY`), and strong CSP. | **Aligned**. |
| **A05:2021-Security Misconfiguration** | Next.js server fails initialization (`process.exit(1)`) if default keys or placeholder secrets are detected. | **Aligned**. |
| **A07:2021-Identification & Auth** | Sliding session timeouts (2h idle, 12h absolute); dynamic session UUID regeneration. | **Aligned**. |
| **A09:2021-Logging & Monitoring** | Every administrative and authentication action is tracked in the database `AuditLogEntry` table. | **Aligned**. |

---

### 2.2 NIST Cybersecurity Framework (CSF v2.0)

* **Identify (ID.AM)**: The platform maintains a software asset inventory in `catalogs/` and dynamically tracks connected tools and models.
* **Protect (PR.AC)**: Enforces RBAC permissions and restricts local loopback actions for highly sensitive endpoints.
* **Detect (DE.AE)**: Diagnostics module detects system drifts, port outages, and large storage logs.
* **Respond (RS.RP)**: Self-healing mechanisms automate recovery tasks (rebooting unresponsive loopback services).
* **Recover (RC.RP)**: Clear backup and restore pipelines (`Backup.ps1`/`Restore.ps1`) for complete system reconstruction.

---

### 2.3 NIST SP 800-53 (High-Level Mapping)

| NIST Family | Control Reference | Platform Implementation | Gap Analysis |
|---|---|---|---|
| **Access Control (AC)** | AC-2, AC-3, AC-6 | Dynamic session validation and RBAC checking. Least Privilege role definitions. | No native integration with enterprise Identity Providers (IDPs) like Microsoft Active Directory. |
| **Audit and Accountability (AU)** | AU-2, AU-6, AU-12 | Database audit logger records all login, logout, and configuration changes. | Logs are saved to a local file system; no automatic syslog or SIEM integration. |
| **Configuration Management (CM)** | CM-2, CM-3 | Configuration histories are cataloged in Prisma `ConfigHistory` model. | Changing configurations requires local file access or administrative role privileges. |
| **Identification and Auth (IA)** | IA-2, IA-8 | Google OAuth 2.0 implementation with cookie-based JWT verification. | No native support for multi-factor authentication (MFA) within local accounts. |
| **System and Comm Protection (SC)** | SC-7, SC-8 | Caddy proxy manages TLS termination and limits connections to localhost loopbacks. | System relies on loopback security; if ports are opened globally, firewall blocks are required. |

---

### 2.4 CIS Controls (v8) — High-Level Mapping

* **Control 3: Data Protection**: AegisOS aligns by keeping inference weights, prompts, and artifacts local, preventing data exposure to external SaaS providers.
* **Control 5: Account Management**: Implements unique session credentials. Gaps: no automated inactive account removal.
* **Control 8: Audit Log Management**: Maintains consistent logs with timestamps, actions, and user SIDs.
* **Control 11: Data Recovery**: Supports automated zipping of all directories and restoring databases using CLI scripts.

---

### 2.5 SOC 2 Trust Services Criteria (High-Level Mapping)

* **Security**: Handled by secure proxy cookies, CSP headers, rate-limiting, and brute-force lockout defenses.
* **Availability**: Measured via port checks in `self-healer.ts` and automated backup recovery.
* **Confidentiality**: Ensured by the local-first execution model. AI prompt routing and artifact data never leave the workstation.
* **Privacy**: Scranton-based scrub filters remove PII (Email, IP addresses, credit cards) in `policy-enforcer.ts` before prompts are processed.

---

### 2.6 ISO/IEC 27001:2022 Annex A Mapping

* **A.5.15 Access Control**: Met via authorization check constraints in Next.js middleware.
* **A.8.12 Data Leakage Prevention**: Scrub filters redact PII dynamically; loopback constraints restrict data exfiltration paths.
* **A.8.20 Network Security**: Localhost network interface binds prevent remote external connections.
* **A.8.24 Use of Cryptography**: Cryptographic keys are protected using host Windows DPAPI bindings.

---

## 3. Key Compliance Gaps Summary

1. **Centralized Log Forwarding**: The platform lacks native support for forwarding logs to Splunk, Datadog, or syslog servers.
2. **Enterprise IDP Integration**: Google OAuth is the only external provider; SAML 2.0 or LDAP integrations are missing.
3. **Hardware Isolation**: Docker containers for Open-WebUI or Ollama run under elevated system accounts; container isolation is not hardened out-of-the-box.
