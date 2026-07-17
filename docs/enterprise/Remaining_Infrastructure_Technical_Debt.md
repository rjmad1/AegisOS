# Remaining Infrastructure Technical Debt

| Field | Value |
|---|---|
| **Document ID** | ITD-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Enterprise Standard |
| **Owner** | Compliance Architect / SRE Lead |

This register tracks remaining items for future enhancement as the platform scales.

## 1. Dynamic Secret Provider Auth Rotation
* **Debt**: Secrets rotation currently requires restarting pods to fetch new Vault/KMS tokens.
* **Mitigation**: Introduce a background polling mechanism in `SecretsPlatform` that updates active database connection strings and session keys dynamically without requiring container restart.

## 2. Automated TLS/mTLS Certificate Rotation
* **Debt**: TLS certificates for Kubernetes Ingress are currently static secrets managed by cert-manager.
* **Mitigation**: Standardize SPIFFE/SPIRE or Linkerd-based service mesh service authentication to implement fully automated certificate rotation and zero-trust mTLS.

## 3. Database Cluster Replication & Read Replicas
* **Debt**: While PostgreSQL StatefulSets are scalable, they currently deploy as single-node instances without active replication configurations.
* **Mitigation**: Standardize on Cloudnative-PG or Crunchy Data operator extensions in Helm templates to automate PostgreSQL master-replica synchronization, read-only pool load balancing, and failovers.

## 4. Air-Gapped Container Registry Mirroring
* **Debt**: Deploying in air-gapped zones requires copying individual image tags to a private registry.
* **Mitigation**: Design a script mapping standard Helm charts dependencies to download, package, and export tarballs containing all required docker images for offline tar-restores.
