# Threat Model

## Methodology

This threat model uses the [STRIDE](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats) framework to systematically identify threats across the AegisOS platform.

## Trust Boundaries

```
┌─ Trust Boundary 1: Internet ─────────────────────────────────────┐
│  Untrusted: External clients, browsers, API consumers           │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS (TLS 1.3)
┌─ Trust Boundary 2: Reverse Proxy ────────────────────────────────┐
│  Nginx/Caddy: TLS termination, rate limiting                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP (internal)
┌─ Trust Boundary 3: Application ──────────────────────────────────┐
│  Next.js Console: Auth, RBAC, API routing, CSRF protection      │
│  Security Proxy: JWT validation, permission enforcement         │
└──────┬────────────────┬─────────────────┬────────────────────────┘
       │                │                 │
┌──────▼──────┐  ┌──────▼──────┐  ┌───────▼──────┐
│ Database    │  │ AI Services │  │ Object Store │
│ (Postgres)  │  │ (Ollama,    │  │ (MinIO)      │
│             │  │  LiteLLM)   │  │              │
└─────────────┘  └─────────────┘  └──────────────┘
  TB4: Data        TB5: Inference    TB4: Data
```

## STRIDE Analysis

### Spoofing (Authentication)

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| Credential brute force | Login API | IP-based lockout after 5 attempts | ✅ Implemented |
| JWT forgery | Auth middleware | HS256 signing with strong secret | ✅ Implemented |
| Default credentials used in production | All services | Startup validation rejects known defaults | ✅ Implemented |
| Session fixation | Session service | Server-side session with DB validation | ✅ Implemented |
| OAuth token theft | Google OIDC | HttpOnly, Secure, SameSite=Strict cookies | ✅ Implemented |

### Tampering (Integrity)

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| CSRF on state-changing requests | Proxy middleware | Origin/Referer validation | ✅ Implemented |
| Request body tampering | API routes | Zod schema validation | ✅ Implemented |
| Database record tampering | Prisma ORM | Parameterized queries (no raw SQL) | ✅ Implemented |
| Container image tampering | CI/CD | Container signing planned | 🔲 Planned |

### Repudiation (Audit)

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| Unauthorized actions untracked | Audit system | AuditLogEntry and AuditEvent models | ✅ Implemented |
| Log tampering | Logging | Centralized logging via Loki | ✅ Implemented |
| No build provenance | CI/CD | SLSA attestation planned | 🔲 Planned |

### Information Disclosure

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| Secrets in source code | Repository | Removed; `.env.example` only | ✅ Remediated |
| Secrets in git history | Git | Dev-only values; rotation mandatory | ⚠️ Accepted Risk |
| Error messages leak internals | API routes | Generic error responses | ✅ Implemented |
| AI output leaks credentials | Evaluation | Safety check in EvaluationPlatform | ✅ Implemented |
| Prompt injection extracts context | AI proxy | Policy enforcer with injection detection | ✅ Implemented |

### Denial of Service

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| API flood | Proxy | In-memory rate limiting | ✅ Implemented |
| Large payload attack | Proxy | 5MB request size limit | ✅ Implemented |
| GPU exhaustion | Ollama | Resource limits in K8s/Docker | ✅ Implemented |
| Distributed rate limiting bypass | Proxy | Redis-backed rate limiting | 🔲 Planned |

### Elevation of Privilege

| Threat | Component | Mitigation | Status |
|--------|-----------|------------|--------|
| Horizontal privilege escalation | RBAC | Permission-based route authorization | ✅ Implemented |
| Container escape | Docker/K8s | Non-root user, security policies | ✅ Implemented |
| Admin panel access without auth | Proxy | Admin route requires `Administrator` role | ✅ Implemented |
| Vault root token exposure | Infrastructure | Removed from tracked files | ✅ Remediated |

## Accepted Risks

| Risk | Rationale | Mitigation |
|------|-----------|------------|
| Dev credential patterns in git history | Values are clearly labeled as dev/dummy; cost of history rewrite exceeds benefit | Documented; rotation required for any real deployment |
| In-memory rate limiting not distributed | Acceptable for single-node deployments; Redis-backed planned for v1.1 | Documented as known limitation |
| OIDC token rotation is stubbed | No production OIDC provider configured yet | Feature-flagged; documented in technical debt |

## Review Schedule

This threat model should be reviewed:
- Before every major release
- After any security incident
- Quarterly, at minimum
