# Environment Variables Reference

> **Purpose**: Complete reference for all AegisOS environment variables.
> **Status**: ACTIVE · CANONICAL
> **Source**: [.env.example](../../.env.example)

---

**Navigation**: [Home](../Home.md) · **Configuration** > Environment Variables
**Related**: [Configuration](../Getting-Started/Configuration.md) · [Secrets Management](../Operations/Secrets-Management.md) · [Docker Compose](Docker-Compose.md)

---

All environment variables are documented in the `.env.example` template file at the repository root. Copy it to create your configuration:

```bash
cp .env.example .env.local     # Local development
cp .env.example .env           # Docker Compose
```

Replace all `CHANGE_ME` values before starting services.

## Critical Security Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ | NextAuth session signing key |
| `OPS_JWT_SECRET` | ✅ | JWT encryption key for API auth |
| `OPS_ADMIN_USERNAME` | ✅ | Admin login username |
| `OPS_ADMIN_PASSWORD` | ✅ | Admin login password |

> The platform **refuses to start** if these are set to default/insecure values.

## Service Connection Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Prisma database connection |
| `OPS_REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `OPS_OLLAMA_HOST` | `http://localhost:11434` | Ollama API endpoint |
| `OPS_LITELLM_HOST` | `http://localhost:4000` | LiteLLM proxy endpoint |

For the complete variable list, see **[.env.example](../../.env.example)**.

---

**Next**: [Docker Compose](Docker-Compose.md) · **Parent**: [Home](../Home.md)
