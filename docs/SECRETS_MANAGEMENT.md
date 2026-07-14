# Secrets Management Guide

## Overview

AegisOS uses a multi-provider secrets management architecture. Secrets are **never stored in source code, configuration files, or container images**.

## Secret Providers

| Provider | Use Case | Config Value |
|----------|----------|-------------|
| **Local DB** (default) | Development, single-node | `SECRETS_PROVIDER=local` |
| **HashiCorp Vault** | Production, multi-node | `SECRETS_PROVIDER=vault` |
| **AWS Secrets Manager** | AWS deployments | `SECRETS_PROVIDER=aws` |
| **Google Secret Manager** | GCP deployments | `SECRETS_PROVIDER=gcp` |
| **Azure Key Vault** | Azure deployments | `SECRETS_PROVIDER=azure` |

## Required Secrets

Every deployment **must** configure the following secrets:

| Secret | Purpose | Generation |
|--------|---------|------------|
| `AUTH_SECRET` | JWT session signing | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `OPS_JWT_SECRET` | Secrets encryption key | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `OPS_ADMIN_USERNAME` | Admin portal username | Choose a unique username |
| `OPS_ADMIN_PASSWORD` | Admin portal password | Minimum 16 chars, mixed case, numbers, symbols |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret | From Google Cloud Console |

## Configuration Methods

### Local Development

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Docker Compose

Create a `.env` file in the project root (it is gitignored):

```bash
cp .env.example .env
# Edit .env — Docker Compose reads this automatically
docker compose up
```

### Kubernetes

**Option A — kubectl (development):**
```bash
kubectl create secret generic aegisos-secrets \
  --namespace=aegisos-ops \
  --from-literal=AUTH_SECRET="$(openssl rand -hex 64)" \
  --from-literal=OPS_JWT_SECRET="$(openssl rand -hex 64)" \
  --from-literal=OPS_ADMIN_USERNAME="your-admin" \
  --from-literal=OPS_ADMIN_PASSWORD="your-secure-password"
```

**Option B — External Secrets Operator (production):**
Use [External Secrets Operator](https://external-secrets.io/) to sync from Vault/AWS/GCP/Azure.

### Helm

```bash
helm install aegisos-ops ./helm/aegisos-ops \
  --set secrets.authSecret="$(openssl rand -hex 64)" \
  --set secrets.jwtSecret="$(openssl rand -hex 64)" \
  --set secrets.adminUsername="your-admin" \
  --set secrets.adminPassword="your-secure-password"
```

## Secret Rotation

### Manual Rotation
1. Generate new secret values
2. Update the secret store (env file, Vault, K8s Secret)
3. Restart affected services
4. Verify health endpoints respond

### Programmatic Rotation
The `SecretsPlatform` class exposes a `rotateKey()` method:
```typescript
await secretsPlatform.rotateKey("old-key-name", "new-key-name");
```

## Security Rules

1. **Never commit `.env` files** — only `.env.example` with placeholders
2. **Never use default values in production** — the platform will refuse to start
3. **Rotate secrets quarterly** or after any suspected compromise
4. **Use unique passwords** per service (Postgres ≠ MinIO ≠ Redis)
5. **Audit access** — review who has access to secret stores regularly

## Insecure Defaults Detection

The platform startup validation rejects known-insecure defaults. If you see:

```
FATAL: AUTH_SECRET environment variable is missing or insecure!
```

This means your `AUTH_SECRET` matches a known placeholder. Generate a new one using the commands above.
