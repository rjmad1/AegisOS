# First-Year Operations Plan — AegisOS

| Field | Value |
|---|---|
| **Document ID** | FYOP-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Operations Plan |
| **Status** | Approved |
| **Owner** | Director of Engineering |

---

## 1. Shift in Engineering Philosophy

As AegisOS transitions from architectural development to sustained product operations, the engineering resource allocation shifts:

* **20% Platform Evolution**: Considers runtime upgrades, security compliance hardening, infrastructure port management, and database index optimization.
* **80% Capability & Value Building**: Dedicated to crafting new user workflows, local agent capabilities, enterprise CRM integrations, and mobile thin-client features that directly leverage the stable underlying core runtime.

This guarantees platform stability and prevents continuous redesign of the foundation, allowing teams to deliver user value quickly.

---

## 2. Maintenance & Operations Budget

To support host workstations, we allocate operational cycles for the following categories:

| Operations Category | Allocation (per Q) | Purpose |
|---|---|---|
| **Workstation Fleet Upgrades** | 40 Hours | Re-run `Bootstrap.ps1` to deploy OS patches and Nvidia driver updates. |
| **Model Weight Optimization** | 24 Hours | Fine-tune local GGUF models and compress embedding indices. |
| **Security Auditing & Compliance** | 30 Hours | Generate CycloneDX SBOM reports, audit JWT tokens, and check firewall gates. |
| **Disaster Recovery Drills** | 12 Hours | Conduct quarterly restoration audits of PostgreSQL and MinIO volume data. |

---

## 3. First-Year Release & Upgrade Lifecycle

AegisOS upgrades are classified into three cycles to prevent runtime disruptions:

### 3.1 Weekly Patch Cycle (P-0 Releases)
* **Scope**: Critical security vulnerability remediation (CVEs) and minor bug fixes in API handlers.
* **Orchestration**: Automatically deployed to containers via minor rebuilds during off-peak weekend hours.
* **Rollback Time**: <2 minutes (immediate revert to the previous container image tag).

### 3.2 Monthly Minor Releases (M-0 Releases)
* **Scope**: Adding new workflow nodes, expanding model context windows, and updating dashboard analytics.
* **Orchestration**: Scheduled for first Saturday of each month. Involves running database scheme updates using Prisma database push.
* **Rollback Time**: <10 minutes (reverts database tables via `RestoreProduction.ps1`).

### 3.3 Quarterly Major Releases (Q-0 Releases)
* **Scope**: Modifying base database engine layouts, upgrading Node LTS runtimes, or swapping primary reasoning LLMs.
* **Orchestration**: Requires full regression verification suites and parallel traffic testing. Scheduled during quarterly maintenance windows.
* **Rollback Time**: <15 minutes (restores full system state using `RestoreProduction.ps1`).

---

## 4. Continuous Compliance Audit Schedule

To maintain regulatory alignment, administrators must generate audits following this schedule:

* **Monthly**: Execute `automation/VerifyCompliance.ps1` to verify SBOM supply chain security.
* **Quarterly**: Audit platform policy violations (jailbreak attempts, safety breaches, unapproved network access).
* **Semi-Annually**: Review paired device list, revoke stale push keys, and audit database user role permissions.
