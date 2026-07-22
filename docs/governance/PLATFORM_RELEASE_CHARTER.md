# AegisOS Platform Release Charter

## 1. Purpose and Scope

The AegisOS Platform Release Charter governs the lifecycle, quality expectations, and approval mechanisms for all platform releases following the freeze of the Version 1 Architecture Baseline. While the Engineering Constitution dictates *what* the architecture can contain, this Charter defines *how* releases are executed to ensure production readiness, reliability, and enterprise-grade quality.

This Charter applies to all major, minor, and patch releases of the AegisOS core, as well as official SDKs and first-party Marketplace packages.

## 2. Release Objectives

Every release must target measurable improvements in product outcomes rather than purely tracking engineering outputs. The primary objectives for any release must align with at least one of the following strategic dimensions:

1. **Production Readiness:** Enhancing deployment repeatability, rollback mechanisms, and operational stability.
2. **Reliability:** Improving SLO adherence, reducing MTTR, and increasing MTBF.
3. **Performance:** Reducing latency, startup times, and resource footprint.
4. **Security:** Hardening the supply chain, resolving vulnerabilities, and improving RBAC/ABAC models.
5. **Developer Experience (DevEx):** Reducing time-to-first-success and improving documentation and SDKs.
6. **Marketplace & Ecosystem Maturity:** Expanding official Solution Packs, Provider Packs, and Connectors without altering core architecture.

## 3. Entry Criteria

Before a new release iteration can officially begin execution, the following criteria must be satisfied:

- **Constitutional Compliance Check:** All proposed features or enhancements must be verified to use existing architectural patterns (extension-first) and not duplicate core engines.
- **Exceptions Approved:** Any required architectural changes must have an explicitly approved entry in the Constitutional Exception Register (CER).
- **Prioritized Backlog:** A finalized Improvement Backlog, prioritized by business value, effort, and risk, must be established.
- **Resource Allocation:** Ownership for Quality Gates (Engineering, QA, Security, Docs) must be assigned.

## 4. Quality Gates

No release may proceed to deployment or publication without passing the following mandatory gates:

| Gate | Description |
|---|---|
| **Architecture Gate** | Validation against the 10 Immutable Articles and the single authoritative runtime principle. |
| **Testing Gate** | 100% pass rate for Unit, Integration, and End-to-End tests. No unmitigated critical path failures. |
| **Security Gate** | Zero high/critical CVEs in dependencies. Successful SBOM generation and package signature verification. |
| **Performance Gate** | Benchmarks must meet or exceed the performance of the previous release (no regressions). |
| **Documentation Gate** | All new features are documented. ADRs are updated. README and Guides align with the implementation. |
| **Governance Gate** | Completion of the Governance Compliance Matrix (GCM) for the release. |

## 5. Exit Criteria

A release is considered ready for General Availability (GA) when:

- All mandatory Quality Gates have passed.
- The Deployment Readiness Score meets the target threshold for supported reference environments (Local, Docker Compose, Kubernetes).
- Reliability telemetry (SLIs/SLOs) is actively collecting data and within the defined Error Budget.
- Release Notes are drafted, reviewed, and published.
- All first-party SDKs and Marketplace packages are synchronized with platform contracts.

## 6. Success Metrics

Post-release success is measured continuously through the Platform Stewardship Loop using concrete telemetry:

- **Deployment Success Rate:** Percentage of successful installations/upgrades across environments.
- **Reliability:** Uptime percentage, MTBF (Hours), and MTTR (Minutes).
- **Performance:** P95 API latency, Platform Intelligence Kernel (PIK) execution latency, and Next.js build times.
- **Adoption:** Number of active Provider/Mission packs deployed.
- **DevEx:** Average time-to-first-success for new developers onboarding via the CLI/SDKs.

## 7. Ownership and Approval Roles

Release execution requires sign-off from the following roles:

| Role | Responsibility | Approval Authority |
|---|---|---|
| **Platform Engineering Lead** | Ensures code quality, performance, and test coverage. | Technical Readiness |
| **Chief Architect** | Validates constitutional compliance and extension-first design. | Architecture Gate |
| **Security Architect** | Signs off on SBOMs, threat models, and vulnerability scans. | Security Gate |
| **Principal SRE** | Verifies observability, deployment assets, and SLO targets. | Operational Readiness |
| **Product Manager** | Confirms the release meets strategic business and ecosystem objectives. | Final GA Approval |
