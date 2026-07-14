# Security Architecture

## Defense in Depth

AegisOS implements multiple independent security layers. Compromise of any single layer does not grant full system access.

```
Layer 1: Network (Nginx/Caddy TLS termination, HSTS)
    │
Layer 2: Rate Limiting (IP-based, 150 req/60s window)
    │
Layer 3: Authentication (JWT validation, session DB check)
    │
Layer 4: Authorization (RBAC permission enforcement)
    │
Layer 5: Input Validation (Zod schemas, size limits, CSRF)
    │
Layer 6: AI Safety (Prompt injection detection, PII masking)
    │
Layer 7: Data Encryption (AES-256-GCM at rest, TLS in transit)
    │
Layer 8: Audit (Event logging, compliance evidence)
```

## Authentication Architecture

### Session Flow
1. User submits credentials to `/api/v1/auth/login`
2. Server validates against env-configured admin credentials
3. Brute-force lockout checked (5 attempts → IP lock)
4. JWT issued via `jose` SignJWT (HS256, configurable expiry)
5. Token set as `HttpOnly`, `Secure`, `SameSite=Strict` cookie
6. Session persisted to database for server-side validation

### Token Introspection
Every protected request triggers `/api/v1/auth/token/introspect`:
- Validates JWT signature
- Checks session exists in database
- Verifies idle timeout (2h) and absolute timeout (12h)
- Validates required RBAC permissions

## Authorization Model (RBAC)

| Role | Permissions |
|------|------------|
| Administrator | All permissions |
| Operator | ViewRuntime, ViewInfrastructure, ViewModels, ViewKnowledge |
| Viewer | ViewRuntime, ViewHealth, ViewLogs |
| Auditor | ViewLogs, ViewHealth, ViewSettings |

## Cryptography

| Use Case | Algorithm | Key Length |
|----------|-----------|------------|
| JWT signing | HMAC-SHA256 | 256-bit (from AUTH_SECRET) |
| Secrets at rest | AES-256-GCM | 256-bit (derived via scrypt from OPS_JWT_SECRET) |
| Key derivation | scrypt | N=16384, r=8, p=1, dkLen=32 |
| Password storage | Plaintext comparison | ⚠️ **Known limitation** — hashing planned |

## Network Security

- All internal service communication over Docker bridge network
- No services exposed to `0.0.0.0` except Nginx (ports 80/443)
- Kubernetes network policies restrict pod-to-pod communication
- Redis requires authentication password

## Container Security

- All containers run as non-root users
- Read-only root filesystem where possible
- Resource limits enforced (CPU, memory, GPU)
- Kubernetes PodSecurityPolicies applied
- No privileged containers

## Supply Chain Security

- CodeQL static analysis on every PR
- Dependabot monitors npm, Actions, and Docker dependencies
- Dependency review blocks known-vulnerable or GPL-licensed packages
- CODEOWNERS requires owner review for security-sensitive files

## Known Limitations

1. Admin password compared in plaintext (bcrypt hashing planned for v1.2)
2. Rate limiting is in-memory, not distributed (Redis-backed planned for v1.1)
3. OIDC token rotation is stubbed (full implementation planned for v1.2)
4. CSP includes `unsafe-eval` and `unsafe-inline` for Monaco editor compatibility
