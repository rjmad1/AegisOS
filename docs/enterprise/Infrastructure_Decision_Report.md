# Infrastructure Decision Report

| Field | Value |
|---|---|
| **Document ID** | IDR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Enterprise Standard |
| **Owner** | Enterprise Architect |

This document records the architectural rationales and design decisions behind the cloud-native, enterprise production infrastructure transformations.

## 1. Dynamic Database Provider Compiling
* **Decision**: Implement a pre-run compile script (`scripts/configure-db.js`) to dynamically patch the database provider inside `prisma/schema.prisma` before generating the client binary.
* **Rationale**: Prisma client binaries are compiled statically to support exactly one provider at compile time. Running the node compilation script allows the codebase to remain completely unchanged while automatically compiling clients for PostgreSQL (in production/cloud) or SQLite (locally).
* **Trade-off**: Requires running `prisma generate` once during container build/startup boot time. However, this avoids runtime ORM query mapping translation layers.

## 2. Local-First Fallback Architecture
* **Decision**: All enterprise production-grade platforms (Redis, Object Storage, secrets, OpenTelemetry) must fall back to local-first equivalents if their remote endpoints or SDK dependencies are absent.
* **Rationale**: Retains 100% backward compatibility for developer workstations. A developer can clone the repo and run `npm run dev` instantly using SQLite, local folders, and local in-memory caches, while the exact same code executes against Redis clusters, AWS S3, and Vault in AWS/GCP Kubernetes grids.
* **Trade-off**: Requires coding dual-mode wrapper classes (e.g. `redisPlatform` and `MemoryCacheProvider`). This investment pays off by eliminating environmental configuration bottlenecks.

## 3. StatefulSet-Based Local AI Scaling
* **Decision**: Deploy Ollama and PostgreSQL/Redis as StatefulSets in Kubernetes rather than generic Deployments.
* **Rationale**: StatefulSets guarantee stable network identifiers (`ollama-0`, `postgres-0`) and persist mounting to specific Persistent Volume Claims (PVCs), preventing database corruptions and model weight load delays across pod restarts.

## 4. OTLP OpenTelemetry Exporting Pipeline
* **Decision**: Integrate standard OTLP HTTP/gRPC exporter middleware mapping custom tracing spans.
* **Rationale**: Standardizes observability tracing with cloud-native monitoring systems (Jaeger, Grafana, Loki, Prometheus) without enforcing vendor lock-in.
