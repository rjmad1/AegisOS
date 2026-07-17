# Pilot Deployment Report — AegisOS

| Field | Value |
|---|---|
| **Document ID** | PDR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Internal / Pilot Validation |
| **Status** | Finalized |
| **Owner** | AI Systems & Infrastructure Architect |

---

## 1. Executive Summary

This report establishes and documents the target topologies and system specifications for pilot deployments of AegisOS across four distinct operating environments:
1. **Developer Workstation** (Local lightweight setup)
2. **Single-User Production** (Dedicated local desktop system)
3. **Multi-User Team** (Workstation-server setup with client endpoints)
4. **Enterprise Proof of Concept** (Federated, high-availability virtualized system)

---

## 2. Environment Profiles & Topologies

### 2.1 Developer Workstation Profile

* **Objective**: Fast prototyping, testing, and sandbox execution of local agent flows.
* **Hardware Requirements**:
  * **CPU**: Intel Core i7 / AMD Ryzen 7 (8 Cores, 16 Threads)
  * **Memory**: 32 GB RAM
  * **GPU**: NVIDIA RTX 4070 (12 GB VRAM) / Apple M-series Pro (Unified Memory)
  * **Storage**: 1 TB NVMe SSD (Minimum read speeds 3500 MB/s)
* **Software Prerequisites**:
  * Windows 11 Pro / macOS Sequoia
  * Node.js v20.x, Git, Docker Desktop
  * SQLite (default file-backed)
  * Locally running Ollama instance (serving `smollm:135m` or `gemma:2b`)
* **Deployment Topology**:
  * Next.js Web Console, SQLite database, and Ollama run directly on the host machine.
  * Loopback address binding (`127.0.0.1`) restricts external access.
* **Operational Assumptions**:
  * Single tenant, single local developer.
  * No strict HA requirements; local SQLite file locking is sufficient for single-writer workloads.

### 2.2 Single-User Production Profile

* **Objective**: Dedicated workstation running enterprise-sovereign models.
* **Hardware Requirements**:
  * **CPU**: Intel Core i9 / AMD Ryzen 9 (12+ Cores)
  * **Memory**: 64 GB RAM
  * **GPU**: NVIDIA RTX 4090 (24 GB VRAM)
  * **Storage**: 2 TB Gen4 NVMe SSD (Read speeds >7000 MB/s)
* **Software Prerequisites**:
  * Windows 11 Pro (WSL2 active) or Linux Ubuntu 22.04 LTS
  * Docker Engine / Docker Compose (Standalone)
  * PostgreSQL 16 (Active container)
  * LiteLLM Proxy and Redis caching
* **Deployment Topology**:
  * Single physical workstation.
  * Services running inside a Docker bridge network (`aegisos-net`).
  * Telemetry collected by OpenTelemetry Collector and displayed via Grafana.
  * Mobile companion client connected via mTLS over Tailscale.
* **Operational Assumptions**:
  * High-concurrency operations during automated agent workflows.
  * High VRAM requirements for serving large reasoning models (`llama3:70b` or `qwen:32b`).
  * Relies on PostgreSQL container for MVCC row-level write scaling.

### 2.3 Multi-User Team Profile

* **Objective**: Shared team workstation/server supporting 5–15 concurrent operators.
* **Hardware Requirements**:
  * **CPU**: Dual Intel Xeon / AMD EPYC (24+ Cores)
  * **Memory**: 128 GB ECC RAM
  * **GPU**: 2x NVIDIA RTX 6000 Ada (48 GB VRAM each) / PCIe NVLink Active
  * **Storage**: 4 TB NVMe SSD RAID 1 (High endurance)
* **Software Prerequisites**:
  * Ubuntu Server 24.04 LTS
  * Docker Swarm / Podman Compose
  * PostgreSQL 16 Cluster
  * Redis Cluster (Distributed locking)
  * Centralized LiteLLM Router for GPU VRAM load-balancing
* **Deployment Topology**:
  * A dedicated central workstation node hosts the databases, caches, and GPU inference.
  * Client endpoints connect to the console via HTTPS using browser sessions.
  * External mobile devices pair using the Tailscale WireGuard mesh network.
* **Operational Assumptions**:
  * Shared model pools with high resource utilization.
  * High rate of concurrent workflow executions triggering parallel database transactions.
  * Strict access controls (LDAP/Entra ID) and role-based permissions (RBAC).

### 2.4 Enterprise Proof of Concept (PoC) Profile

* **Objective**: Air-gapped enterprise-controlled server cage deployment.
* **Hardware Requirements**:
  * **Compute Node**: 4x HPE ProLiant Gen11 servers
  * **GPU Nodes**: NVIDIA H100 PCIe (8x GPUs total)
  * **Storage Node**: Pure Storage FlashBlade (100 TB Ceph / NVMe-oF)
* **Software Prerequisites**:
  * Red Hat Enterprise Linux (RHEL) 9.4 / Rancher K3s
  * Kubernetes (Helm deployments)
  * PostgreSQL Enterprise (with pgpool-II or Patroni replication)
  * MinIO Tenant Cluster (S3-compatible API)
* **Deployment Topology**:
  * Kubernetes orchestrates console replicas, Prometheus monitoring, and Loki log pipelines.
  * High Availability (HA) failover configured for database and object stores.
  * Air-gapped configuration with local model storage sync via secure offline registries.
* **Operational Assumptions**:
  * Zero-trust environment with strict network boundaries.
  * All paired mobile clients require ECDSA signed pairing challenges matching Enclave fingerprints.
  * Performance targets require 99.9% availability of core API endpoints.
