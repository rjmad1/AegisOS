# Configuration Reference

> **Purpose**: Post-installation configuration tuning and environment variable reference.
> **Audience**: Administrators, DevOps Engineers
> **Status**: ACTIVE · CANONICAL
> **Owner**: Raja Jeevan Kumar Maduri

---

**Navigation**: [Home](../Home.md) · [Getting Started](Installation.md) > Configuration
**Related**: [Environment Variables](../Configuration/Environment-Variables.md) · [Secrets Management](../Operations/Secrets-Management.md) · [Deployment](../Operations/Deployment.md)

---

## Configuration Files

| File | Purpose |
|---|---|
| `.env.local` | Local development overrides |
| `.env.production` | Production environment settings |
| `.env.example` | Template with all variables documented |
| `configs/ports.json` | Dynamic port allocation registry |
| `configs/prometheus.yml` | Prometheus scrape targets |
| `configs/nginx.conf` | Reverse proxy configuration |
| `configs/otel-collector-config.yaml` | OpenTelemetry collector pipeline |

## Key Configuration Areas

### Security Secrets
All secrets must be generated before first run. The platform **refuses to start** with default/insecure values.

```bash
# Generate strong secrets
openssl rand -hex 64   # AUTH_SECRET, OPS_JWT_SECRET
openssl rand -base64 24  # Database passwords, API keys
```

See [Secrets Management](../Operations/Secrets-Management.md) for full generation and rotation procedures.

### AI Model Configuration
| Variable | Default | Description |
|---|---|---|
| `OPS_OLLAMA_HOST` | `http://localhost:11434` | Ollama API endpoint |
| `OPS_LITELLM_HOST` | `http://localhost:4000` | LiteLLM proxy endpoint |
| `ModelManifest.json` | (root) | Model routing configuration |

### Database Configuration
| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | Prisma database connection string |
| `OPS_REDIS_URL` | `redis://localhost:6379` | Redis cache connection |

### Observability
| Variable | Default | Description |
|---|---|---|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4317` | OpenTelemetry collector |
| `OPS_PROMETHEUS_PORT` | `9090` | Prometheus metrics endpoint |

---

## Deployment Profiles

AegisOS supports parameterized deployment profiles in `automation/profiles/`:

| Profile | Use Case |
|---|---|
| `default` | Standard single-workstation deployment |
| `development` | Developer workstation with debug tooling |
| `personal` | Minimal footprint, single-user |
| `enterprise` | Multi-tenant, full observability stack |
| `offline` | Air-gapped, no external network dependencies |

```powershell
.\automation\Configure.ps1 -Profile enterprise
```

---

## What's Next?

- **[Environment Variables](../Configuration/Environment-Variables.md)** — Complete variable reference
- **[Docker Compose](../Configuration/Docker-Compose.md)** — Container configuration
- **[Deployment](../Operations/Deployment.md)** — Full deployment guide

---

**Previous**: [Quick Start](Quick-Start.md)
**Next**: [Platform Overview](../Architecture/Platform-Overview.md)
**Parent**: [Home](../Home.md)
