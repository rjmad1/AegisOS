# Release Engineering Framework — AegisOS Release Governance

| Field | Value |
|---|---|
| **Document ID** | REF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Release Engineering Standard |
| **Owner** | DevOps Lead |

---

## 1. Release Channels & Pipelines

To balance rapid developer iteration with enterprise stability, AegisOS builds are distributed across five release channels:

```
+---------------------------------------------------------------------------------+
| Nightly Channel: Daily automatic trunk builds. Untested.                        |
+---------------------------------------------------------------------------------+
                                       |
+---------------------------------------------------------------------------------+
| Dev Channel: Weekly builds incorporating approved feature PRs.                  |
+---------------------------------------------------------------------------------+
                                       |
+---------------------------------------------------------------------------------+
| Beta Channel: Bi-weekly feature freezes; open to testing and partner feed.      |
+---------------------------------------------------------------------------------+
                                       |
+---------------------------------------------------------------------------------+
| Release Candidate (RC): Hardened builds undergoing soak testing.                |
+---------------------------------------------------------------------------------+
                                       |
+---------------------------------------------------------------------------------+
| Stable / LTS Channel: Enterprise-certified releases. Highly stable.             |
+---------------------------------------------------------------------------------+
```

---

## 2. Automated Quality Gates

No build can transition between release channels without passing these automated CI/CD pipeline checks:

```
                     +---------------------------------------+
                     |         Code Commit Trigger           |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |         Gate 1: Static Checks         |
                     |  - TypeScript linting compiles (zero) |
                     |  - Formatting conforms (prettier)     |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |         Gate 2: Unit Testing          |
                     |  - 100% test success rate             |
                     |  - Minimum 85% test coverage          |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |        Gate 3: Security Scan          |
                     |  - Trivy / Snyk dependency scan       |
                     |  - Gitleaks secrets audit             |
                     |  - CycloneDX SBOM exported            |
                     +---------------------------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |       Gate 4: Performance Check       |
                     |  - Port diagnostics verified          |
                     |  - Memory footprint check < 200MB     |
                     +---------------------------------------+
```

---

## 3. Emergency Hotfix Process

If a critical vulnerability (CVE > 8.0) or system-blocking bug is discovered in a Stable release, the hotfix protocol is triggered:

1. **Branching**: Branch directly from the active release tag (e.g., `release/v1.0.1` -> `hotfix/v1.0.1-cve-fix`).
2. **Scoping**: Limit changes to the absolute minimum required to fix the issue. No other feature additions or formatting refactors are permitted.
3. **Validation**: Execute target regression tests, security scans, and port diagnostics.
4. **Promotion**: Skip the Beta and RC soak periods. Promote directly to the Stable channel under a patch version increment (e.g., `v1.0.2`).
5. **Porting**: Cherry-pick the hotfix commit back into `main` to prevent regression in future minor releases.

---

## 4. Automated Rollback Process

In production environments, a rollback is executed automatically or with one-click orchestration on these triggers:
* **Liveness Failures**: The core console API or inference loop fails to respond to liveness probes within 3 minutes of start.
* **Error Rate Spike**: Internal server error rate (HTTP 500) exceeds 5% of total traffic over any 5-minute rolling window.
* **Database Deadlocks**: Migration script fails to execute or triggers lock timeouts on schema update.

### Rollback Execution Details
1. **Drain Traffic**: Active requests are routed away from the upgrading node using canary ingress policies.
2. **Revert DB**: Restore the database schema to the snapshot snapshot taken prior to upgrade (`Restore.ps1`).
3. **Redeploy Code**: Swap container images or service bindings back to the previous stable release hash.
4. **Attestation**: Confirm health probes return green before releasing user traffic.
