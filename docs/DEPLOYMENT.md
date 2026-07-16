# Deployment Guide

This guide covers all deployment methods for AegisOS. For Windows-specific bootstrap setup, see [Deployment_Guide.md](Deployment_Guide.md).

---

## Prerequisites

| Software | Minimum Version | Purpose |
| ---------- | ---------------- | --------- |
| Node.js | 20 LTS | Runtime |
| npm | 10+ | Package manager |
| Docker | 24+ | Container deployment |
| Git | 2.x | Version control |

---

## 1. Local Development

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/rjmad1/AegisOS.git
cd AegisOS

# 2. Create environment configuration
cp .env.example .env.local
# Edit .env.local — replace all CHANGE_ME values

# 3. Install dependencies
npm install

# 4. Initialize the database
npx prisma db push

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Configuration

All secrets must be configured before first run. See [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) for generation instructions.

The platform will refuse to start if any of the following are set to default/insecure values:
- `AUTH_SECRET`
- `OPS_JWT_SECRET`
- `OPS_ADMIN_USERNAME`
- `OPS_ADMIN_PASSWORD`

---

## 2. Docker Compose (Recommended for Production)

### Setup

```bash
# 1. Create environment file
cp .env.example .env
# Edit .env — configure ALL credentials with strong unique values

# 2. Build and start all services
docker compose up -d --build

# 3. Verify health
docker compose ps
curl http://localhost:3000/health
```

### Services Started

The stack maps several host-side services. All host ports are configured dynamically and support auto-remapping in case of conflicts (see [PORTS_MANAGEMENT.md](PORTS_MANAGEMENT.md) for details).

| Service | Default Host Port | Internal Container Port | Purpose |
| --------- | ------------------- | ------------------------- | --------- |
| Console | 3000 | 3000 | Admin dashboard UI |
| Nginx | 80 / 443 | 80 / 443 | HTTPS reverse proxy |
| PostgreSQL | 5432 | 5432 | Database engine |
| Redis | 6379 | 6379 | Caching and queue layer |
| MinIO | 9000 / 9001 | 9000 / 9001 | Object storage & Console |
| Ollama | 11434 | 11434 | Local AI inference engine |
| LiteLLM | 4000 | 4000 | AI Router and Proxy |
| Prometheus | 9090 | 9090 | Metrics gathering |
| Grafana | 3002 | 3000 | Metrics visualization |
| Jaeger | 16686 | 16686 | Distributed tracing |
| Loki | 3100 | 3100 | Log aggregation |
| OTel Collector | 4317 / 4318 | 4317 / 4318 | Telemetry data collector |

### GPU Support

For NVIDIA GPU acceleration:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up -d
```

### Production Overrides

For production resource limits and replicas:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Stopping

```bash
docker compose down          # Stop containers (keep data)
docker compose down -v       # Stop and delete volumes (destroys data)
```

---

## 3. Kubernetes

### Namespace Setup

```bash
kubectl apply -f k8s/namespaces.yaml
```

### Secrets

**Do not apply `k8s/secrets.yaml` directly** — it contains placeholder values.

Create secrets manually:

```bash
kubectl create secret generic aegisos-secrets \
  --namespace=aegisos-ops \
  --from-literal=AUTH_SECRET="$(openssl rand -hex 64)" \
  --from-literal=OPS_JWT_SECRET="$(openssl rand -hex 64)" \
  --from-literal=OPS_ADMIN_USERNAME="your-admin" \
  --from-literal=OPS_ADMIN_PASSWORD="$(openssl rand -base64 24)" \
  --from-literal=GOOGLE_CLIENT_ID="your-oauth-client-id" \
  --from-literal=GOOGLE_CLIENT_SECRET="your-oauth-secret" \
  --from-literal=DATABASE_URL="postgresql://user:pass@postgres-service:5432/aegisos" \
  --from-literal=REDIS_URL="redis://:pass@redis-service:6379" \
  --from-literal=VAULT_TOKEN="your-vault-token" \
  --from-literal=MINIO_ROOT_USER="your-minio-user" \
  --from-literal=MINIO_ROOT_PASSWORD="$(openssl rand -base64 24)"
```

### Deploy

```bash
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/security-policies.yaml
kubectl apply -f k8s/network-policies.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/persistent-volumes.yaml
kubectl apply -f k8s/postgresql.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/ollama-statefulset.yaml
kubectl apply -f k8s/litellm-deployment.yaml
kubectl apply -f k8s/console-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Verify

```bash
kubectl get pods -n aegisos-ops
kubectl logs -n aegisos-ops deployment/console --tail=50
```

---

## 4. Helm Chart

```bash
helm install aegisos-ops ./helm/aegisos-ops \
  --namespace aegisos-ops \
  --create-namespace \
  --set secrets.authSecret="$(openssl rand -hex 64)" \
  --set secrets.jwtSecret="$(openssl rand -hex 64)" \
  --set secrets.adminUsername="your-admin" \
  --set secrets.adminPassword="$(openssl rand -base64 24)" \
  --set secrets.googleClientId="your-client-id" \
  --set secrets.googleClientSecret="your-client-secret" \
  --set secrets.databaseUrl="postgresql://user:pass@postgres:5432/aegisos" \
  --set secrets.redisUrl="redis://:pass@redis:6379"
```

The Helm chart will **fail** if any secret value is empty, preventing accidental deployment without credentials.

---

## 5. Rollback

### Docker Compose

```bash
docker compose down
docker compose up -d  # Re-launches from current images
```

### Kubernetes

```bash
kubectl rollout undo deployment/console -n aegisos-ops
```

### Helm

```bash
helm rollback aegisos-ops 1 --namespace aegisos-ops
```

---

## 6. Health Checks

| Endpoint | Purpose | Expected |
| ---------- | --------- | ---------- |
| `GET /health` | Application health | `200 OK` |
| `GET /ready` | Readiness (dependencies up) | `200 OK` |
| `GET /live` | Liveness (process running) | `200 OK` |
| `GET /status` | Detailed system status | JSON payload |

---

## 7. Troubleshooting

| Symptom | Cause | Fix |
| --------- | ------- | ----- |
| `FATAL: AUTH_SECRET ... missing or insecure!` | Default/empty secret used | Set a proper secret in `.env` |
| `FATAL: OPS_JWT_SECRET ... required` | Missing encryption key | Set `OPS_JWT_SECRET` in `.env` |
| Docker: `Set POSTGRES_PASSWORD in .env` | Missing `.env` file | Copy `.env.example` to `.env` |
| Helm: `fail: secrets.authSecret is required` | Missing `--set` values | Provide all required secrets |
| Cannot connect to database | Database not ready | Wait for PostgreSQL health check |
| `ECONNREFUSED :11434` | Ollama not running | Verify Ollama service is started |
