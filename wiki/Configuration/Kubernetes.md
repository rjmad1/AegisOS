# Kubernetes Configuration

> **Status**: ACTIVE · CANONICAL · **Source**: [k8s/](../../k8s/)

---

**Navigation**: [Home](../Home.md) · [Configuration](Environment-Variables.md) > Kubernetes

See [Deployment Guide — Kubernetes section](../Operations/Deployment.md) for usage instructions.

### Manifest Files

| File | Purpose |
|---|---|
| `namespaces.yaml` | Namespace definition |
| `secrets.yaml` | Secret templates (do NOT apply directly) |
| `configmaps.yaml` | Configuration maps |
| `security-policies.yaml` | Pod security policies |
| `network-policies.yaml` | Network segmentation |
| `rbac.yaml` | Role-based access control |
| `persistent-volumes.yaml` | Storage claims |
| `postgresql.yaml` | Database deployment |
| `redis.yaml` | Cache deployment |
| `ollama-statefulset.yaml` | Inference engine |
| `litellm-deployment.yaml` | AI router |
| `console-deployment.yaml` | Admin dashboard |
| `ingress.yaml` | External access |

**Previous**: [Docker Compose](Docker-Compose.md) · **Next**: [Helm Chart](Helm-Chart.md) · **Parent**: [Configuration](Environment-Variables.md)
