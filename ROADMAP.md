# AegisOS Roadmap

## Vision
AegisOS aims to be the definitive enterprise-grade, local-first Autonomic AI Workstation Operating System — enabling organizations to run AI inference, agent orchestration, and system administration with full data sovereignty, cryptographic security, and automated self-healing.

---

## Current Release: v1.2.0 (Active)

### ✅ Delivered Capabilities

#### 1. Autonomic OS Foundation (v1.0.0)
- Strict 7-layered architecture stack (Layer 6 to 0).
- Local-first inference routing (Ollama + LiteLLM integration).
- Multi-provider secrets manager (Vault, AWS, GCP, Azure, Local DPAPI).
- Structured schema-driven event bus and background job queues.
- Local Model Context Protocol (MCP) host with filesystem/git/RAG tool integrations.

#### 2. Security Hardening & Observability (v1.1.0)
- Zero-trust authentication via HttpOnly JWT cookies and RBAC guards.
- Security enforcement: brute-force lockout, rate limiting, and secure headers.
- OpenTelemetry collector pipeline compiling traces, logs, and metrics (Prometheus, Grafana, Loki).
- Standard compliance audits (SOC2 controls AC-1, CRYP-1, AUD-1, SUP-1).

#### 3. Command, Control & Digital Twin (v1.2.0)
- **Executive Control Plane (ECP)** at Layer 5 enforcing prompt/response policy checks and safety firewalls.
- **System Digital Twin**: Canonical state graph (`GraphKernel`) representing active topologies and capabilities.
- **Convergence Engine**: Incremental reconciliation of discovery states with automated drift repair (`DigitalTwinDriftLog`).
- **Autonomic Platform Qualification Framework (PQF)**: Validation orchestrators (chaos, scalability, performance, endurance) compiling content-addressed Merkle evidence chains (`EvidenceGraph`).
- **Release Manifest Signing**: Cryptographic HMAC-SHA256 signature verifications on release packages.
- **Engineering Intelligence Platform (EIP)**: Sub-engines correlating logs, predicting anomalies, and prioritizing remediation queues.
- **Mobile Companion App**: Flutter-based mobile dashboard supporting remote approvals and C2 signing keys.

---

## v1.3.0 — Advanced Optimization & Horizontal Scaling (Next)

- [ ] **Dynamic VRAM Scheduling**: Idle models auto-unloading and smart GPU memory paging thresholds.
- [ ] **Filesystem Event Watcher**: Real-time file change monitoring for automated RAG vector re-indexing.
- [ ] **Workflow Parallelism**: Concurrent step executions in the Layer 4 Workflow Engine.
- [ ] **Distributed Rate Limiting**: Redis-backed limits for multi-user console ingress.
- [ ] **OIDC Oauth2 Token Rotation**: Enhanced SSO client configuration panel.

---

## v2.0.0 — Multi-Node Autonomic Clustering (Future)

- [ ] **Multi-Node Cluster Coordinator**: mTLS-secured control planes syncing state across separate physical workstations.
- [ ] **Federated RAG & Model Mesh**: Distributed semantic search queries and shared GPU inference routing.
- [ ] **Cryptographic Sandbox Workspaces**: Sandboxed container namespaces for guest agents.
- [ ] **Continuous Reinforcement Tuning**: Local preference learning loops utilizing user feedback to fine-tune active quants.
