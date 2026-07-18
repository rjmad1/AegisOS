# Security Architecture

> **Purpose**: Defense-in-depth security design for AegisOS.
> **Audience**: Security engineers, architects, auditors
> **Status**: ACTIVE · CANONICAL
> **Owner**: Raja Jeevan Kumar Maduri
> **Source**: [SECURITY_ARCHITECTURE.md](../../docs/SECURITY_ARCHITECTURE.md)

---

**Navigation**: [Home](../Home.md) · [Architecture](Platform-Overview.md) > Security Architecture
**Related**: [Threat Model](Threat-Model.md) · [Security Policy](../Security/Security-Policy.md) · [Secrets Management](../Operations/Secrets-Management.md)

---

For the complete security architecture specification, see the source document:

**📄 [Security Architecture — Full Document](../../docs/SECURITY_ARCHITECTURE.md)**

## Summary

AegisOS implements 8 independent security layers. Compromise of any single layer does not grant full system access:

```
Layer 1: Network        (Nginx/Caddy TLS termination, HSTS)
Layer 2: Rate Limiting  (IP-based, 150 req/60s window)
Layer 3: Authentication (JWT validation, session DB check)
Layer 4: Authorization  (RBAC permission enforcement)
Layer 5: Input Valid.   (Zod schemas, size limits, CSRF)
Layer 6: AI Safety      (Prompt injection detection, PII masking)
Layer 7: Data Encrypt.  (AES-256-GCM at rest, TLS in transit)
Layer 8: Audit          (Event logging, compliance evidence)
```

## Related Security Documentation

| Document | Scope |
|---|---|
| [Threat Model](Threat-Model.md) | STRIDE analysis across trust boundaries |
| [Security Policy](../Security/Security-Policy.md) | Vulnerability reporting procedures |
| [Secrets Management](../Operations/Secrets-Management.md) | Credential lifecycle management |
| [Security Governance Framework](../../docs/enterprise/06_security_governance.md) | Enterprise security governance |
| [Productization Security](../../docs/productization/09_security_governance_framework.md) | Zero Trust, mTLS, SBOM |

---

**Previous**: [Platform Overview](Platform-Overview.md)
**Next**: [Threat Model](Threat-Model.md)
**Parent**: [Architecture](Platform-Overview.md)
