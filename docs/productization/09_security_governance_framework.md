# Security Governance Framework — AegisOS Security Standards

| Field | Value |
|---|---|
| **Document ID** | SGF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Security Standard |
| **Owner** | Chief Information Security Officer (CISO) |

---

## 1. Zero Trust Architecture

AegisOS adheres to Zero Trust principles: **Never Trust, Always Verify**.
* **Micro-Perimeter Network**: Every service runs isolated on host loopbacks or private subnets. Cross-boundary API calls require authentication.
* **Ephemeral Credentials**: Service-to-service sessions use short-lived JWT tokens (15-minute expiry) that are refreshed via HTTP-only cookie rotators.
* **Sandboxed Tool Execution**: Agent tool calls (e.g., executing Python script, writing files) are executed in isolated, CPU/Memory-constrained sandbox environments.

---

## 2. Identity Federation & RBAC/ABAC

### 2.1 Identity Federation
The platform supports integration with enterprise identity providers via standard OpenID Connect (OIDC) and LDAP protocols:
* **Entra ID / Okta**: Single Sign-On (SSO) is enabled by configuring Tenant IDs and client secrets.
* **Active Directory (LDAP)**: Workstations query corporate LDAP trees for user attributes and security group memberships.

### 2.2 Access Control Models
* **Role-Based Access Control (RBAC)**: Enforces access based on defined roles.
  - `Administrator`: Full system controls, DB migrations, extension installs.
  - `Developer`: Build workflows, configure prompts, test models.
  - `Operator`: View logs, run service backups, check system health.
* **Attribute-Based Access Control (ABAC)**: Evaluates dynamic conditions at runtime:
  - *Context Policy*: "Allow Marcus (Developer) to query LiteLLM ONLY if workstation IP matches private VPN range AND model cost matches current project budget."

---

## 3. Secrets and Certificate Lifecycle

* **Secrets Rotation**: Configuration secrets (DB passwords, model keys) are stored in database-encrypted cells (using AES-256-GCM and DPAPI machine keys) or retrieved dynamically from Vault. Vault secrets are rotated every 90 days.
* **Certificate Lifecycle (mTLS)**: Cluster node-to-node communication requires mutual TLS. Nodes generate ephemeral keys, which are signed by a local Root Certificate Authority (CA) managed by the platform.
* **Revocation Policies**: Compiling nodes check Certificate Revocation Lists (CRL) during connection handshakes. Expired or compromised certificates block communication.

---

## 4. Supply Chain Security & Attestation

To protect against package injection attacks, the release pipeline implements comprehensive supply chain security:

```
+--------------------------------------------------------------+
|                     1. SBOM Generation                       |
|        Generate CycloneDX SBOM tracking all dependencies    |
+--------------------------------------------------------------+
                               |
+--------------------------------------------------------------+
|                   2. Container Signing                       |
|           Sign Docker containers using Cosign & KMS          |
+--------------------------------------------------------------+
                               |
+--------------------------------------------------------------+
|                   3. Runtime Attestation                     |
|         Validate container signatures before K8s launch      |
+--------------------------------------------------------------+
```

* **SBOM Generation**: Every release generates a CycloneDX format Software Bill of Materials (SBOM) listing all transitive packages, libraries, and licenses.
* **Container Signing**: Release Docker images are signed using Cosign and verified via KMS keys.
* **Runtime Attestation**: Container orchestrators run admission controllers to verify image signatures and SBOM hashes before allowing pods to boot.

---

## 5. Enterprise Compliance Mapping

AegisOS controls map directly to industry standards:

| Compliance Control | Standard Mapping | AegisOS Implementation Mechanism |
|---|---|---|
| **AC-1 (Access Control)** | SOC2 CC6.1 / ISO27001 A.9.1.1 | OIDC SSO integration + RBAC roles enforcement |
| **SC-7 (Network Boundary)**| NIST SP 800-53 SC-7 | Loopback-only service isolation + mTLS cluster encryption |
| **SI-4 (Security Monitoring)**| NIST SP 800-53 SI-4 | OpenTelemetry tracing + Event Bus logs stream to EIP |
| **MP-4 (Media Transport)** | SOC2 CC6.6 / ISO27001 A.8.2.3 | AES-256-GCM database encryption + DPAPI key validation |
| **Supply Chain Compliance** | Executive Order 14028 | Automated CycloneDX SBOM generation on release |
