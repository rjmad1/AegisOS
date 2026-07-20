# Master Documentation Index

| Metadata | Value |
|---|---|
| **Document ID** | MDI-2026-001 |
| **Version** | 1.2.0 (Active) |
| **Last Updated** | 2026-07-20 05:40:00 |
| **Classification** | Public — Index Registry |

Welcome to the AegisOS platform documentation repository. This directory houses the canonical, structured guides and handbooks for developers, administrators, and operators.

---

## 1. Architectural Blueprint & Platform Guides

*   **[Architecture Handbook](Architecture_Handbook.md)**: Details the 7-layered autonomic architecture, ECP controllers, Digital Twin graph kernels, Convergence Engine, and PQF qualification.
*   **[Platform Handbook](Platform_Handbook.md)**: Catalog of active services, model registries (`ModelManifest.json`), and the central Platform Kernel Services (PECS, PRM, PPS, PAOS).
*   **[Deployment Guide](DEPLOYMENT.md)**: Deployment methods (local, Docker, Kubernetes, Helm) and migration procedures.
*   **[Developer Guide](Developer_Guide.md)**: Onboarding instructions, dynamic component registrations, and API route conventions.
*   **[Operations Guide](Operations_Guide.md)**: Running service administration, logs directories, and database backup guides.
*   **[Troubleshooting Guide](Troubleshooting_Guide.md)**: Diagnostics runbooks for port collisions, self-healer drift alarms, GPU VRAM issues, and safety firewall blocks.

---

## 2. Governance & Compliance Reports

*   **[Platform Governance Package](governance/Platform_Governance_Package.md)**: Prisma database models, event bus contracts, and release signing procedures.
*   **[Documentation Coverage Report](Documentation_Coverage_Report.md)**: Live documentation health scorecards, cross-link completeness, and drift assessment.
*   **[Digital Twin Diagram](governance/digital_twin.md)**: Mermaid layout representing the virtual components boundary.
*   **[Executive Scorecard](governance/executive_scorecard.md)**: Baseline vs target maturity index across operational domains.

---

## 3. Productization & Enterprise Specifications

*   **[Product Architecture Specification](productization/02_product_architecture_specification.md)**: Core vs EIP boundary separations.
*   **[Extension Framework Specification](productization/04_extension_framework_specification.md)**: Metadata schemas and sandboxed plugin lifecycles.
*   **[SDK Architecture Guide](productization/05_sdk_architecture.md)**: Public APIs, error contracts, and authentication protocols.
*   **[Platform Economics Assessment](productization/11_platform_economics_assessment.md)**: Local vs cloud compute costing models and VRAM efficiencies.
*   **[Three-Year Product Roadmap](productization/13_three_year_product_roadmap.md)**: Timeline spanning multi-node clustering and autonomic networks.
