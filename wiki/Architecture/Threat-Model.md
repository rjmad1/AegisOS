# Threat Model

> **Purpose**: STRIDE threat analysis across all AegisOS trust boundaries.
> **Audience**: Security engineers, architects, auditors
> **Status**: ACTIVE · CANONICAL
> **Source**: [THREAT_MODEL.md](../../docs/THREAT_MODEL.md)

---

**Navigation**: [Home](../Home.md) · [Architecture](Platform-Overview.md) > Threat Model
**Related**: [Security Architecture](Security-Architecture.md) · [Security Policy](../Security/Security-Policy.md)

---

For the complete threat model, see: **📄 [Threat Model — Full Document](../../docs/THREAT_MODEL.md)**

## Methodology

Uses the [STRIDE](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats) framework.

## Trust Boundaries

| Boundary | Components |
|---|---|
| TB1: Internet | External clients, browsers, API consumers |
| TB2: Reverse Proxy | Nginx/Caddy — TLS termination, rate limiting |
| TB3: Application | Next.js Console, Security Proxy — auth, RBAC, CSRF |
| TB4: Data | PostgreSQL, MinIO |
| TB5: Inference | Ollama, LiteLLM |

---

**Previous**: [Security Architecture](Security-Architecture.md)
**Next**: [ADR Index](ADR-Index.md)
**Parent**: [Architecture](Platform-Overview.md)
