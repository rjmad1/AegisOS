# Three-Year Product Roadmap — AegisOS Product Milestones

| Field | Value |
|---|---|
| **Document ID** | TYR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Strategic Roadmap |
| **Owner** | Chief Product Officer (CPO) |

---

## 1. Three-Horizon Strategic Overview

The AegisOS strategic roadmap is split across three distinct timelines:

```
                    Horizon 1 (0–6 Months)
                    [Platform Stabilization & Enterprise Readiness]
                    - Complete SDK packaging (JS/TS, Python, CLI)
                    - Implement strict mTLS and OIDC integrations
                    - Automate CycloneDX SBOM & Cosign image signing
                    - Stabilize single-node deployments and SCM/NSSM runners
                                       |
                                       v
                    Horizon 2 (6–18 Months)
                    [Distributed Clustering & Extension Marketplace]
                    - Support multi-node active-active workstation clustering
                    - Establish the dynamic Extension Marketplace for plugins
                    - Implement Iceberg federated catalog integration
                    - Harden Firecracker microVM tool-execution sandboxes
                                       |
                                       v
                    Horizon 3 (18–36 Months)
                    [Autonomous Operations & Autonomous AI Fabric]
                    - Enable self-governing multi-node AI compute fabrics
                    - Deploy autonomic EIP anomaly remediation agents
                    - Launch federated cross-enterprise knowledge sharing
                    - Automate SOC2 Type II audit report compilation
```

---

## 2. Horizon 1: Platform Stabilization (0–6 Months)

* **Objective**: Resolve technical debt, package developer SDKs, stabilize security baselines, and automate release pipelines.
* **Milestones**:
  - *Month 2*: Publish NPM package `@aegisos/sdk-js` and PyPI package `aegisos-sdk` containing baseline REST/WebSocket wrappers.
  - *Month 4*: Roll out OIDC identity federation supporting Microsoft Entra ID and Okta SSO configurations out-of-the-box.
  - *Month 6*: Deploy automated release trains building Docker images with signed SBOM attestation tags on every release commit.

---

## 3. Horizon 2: Distributed Execution (6–18 Months)

* **Objective**: Enable multi-node scaling, launch the plugin developer portal, and connect to remote enterprise lakehouses.
* **Milestones**:
  - *Month 9*: Support multi-node load balancing on the Event Bus, allowing workstations to share background tasks using mTLS verification.
  - *Month 12*: Launch the Extension Marketplace, providing an auto-discovery index for certified community plugins, skills, and agents.
  - *Month 15*: Integrate Iceberg REST catalog adapters, enabling local models to run direct RAG queries on remote AWS/Dataproc data lakes.
  - *Month 18*: Transition local sandboxing from Node `vm2` to Firecracker microVMs, preventing system access by executed agent scripts.

---

## 4. Horizon 3: Autonomous Operations (18–36 Months)

* **Objective**: Establish self-optimizing system fabrics, automate audit generation, and evolve the Engineering Intelligence Platform.
* **Milestones**:
  - *Month 24*: Evolve the EIP Correlation Engine into an autonomous actuator, letting it adjust database indices and schedule VRAM workloads dynamically.
  - *Month 30*: Enable cross-enterprise federated learning, letting separate corporate nodes share RAG model training weights without exposing data.
  - *Month 36*: Automate compliance reporting, letting AegisOS output real-time attestation reports for SOC2 Type II, ISO 27001, and NIST audits.
