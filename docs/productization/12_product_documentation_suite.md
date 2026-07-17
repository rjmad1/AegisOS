# Product Documentation Suite — AegisOS Reference Map

| Field | Value |
|---|---|
| **Document ID** | PDS-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-17 |
| **Classification** | Public / Documentation Index |
| **Owner** | Enterprise Documentation Architect |

---

## 1. Documentation Map and Catalog

The AegisOS documentation catalog is organized into functional suites to serve different audience personas:

### 1.1 Architectural Guides
* **[Platform Reference Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Architecture_Handbook.md)**: Architectural blueprints, Mermaid data-flows, and system decompositions.
* **[Product Architecture Specification](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/02_product_architecture_specification.md)**: Details logical component boundaries and EIP decoupling guidelines.
* **[Architecture Handbook](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Architecture_Handbook.md)**: Deep dive into the Platform Kernel, Event Bus, and Service Registry designs.

### 1.2 Administrative and Operations Manuals
* **[Enterprise Deployment Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/06_enterprise_deployment_guide.md)**: Sizing tables, Kubernetes manifests, and hardware specifications.
* **[Operations Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Operations_Guide.md)**: Runbook for log rotation, active service management, and telemetry ingestion.
* **[Administrator Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Administrator_Guide.md)**: Covers OAuth OIDC, LDAP authentication, and DPAPI key management.
* **[Troubleshooting Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Troubleshooting_Guide.md)**: Outlines diagnostics for port conflicts, GPU VRAM issues, and network timeouts.
* **[Disaster Recovery Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Disaster_Recovery_Guide.md)**: Step-by-step restoration procedures using `Restore.ps1` and DPAPI keys.

### 1.3 Developer Handbooks
* **[SDK Guide / SDK Architecture](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/05_sdk_architecture.md)**: APIs, error schemas, and cross-language contracts.
* **[Extension Development Guide / Framework Spec](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/04_extension_framework_specification.md)**: Defines `manifest.json` schemas, auto-discovery, and the sandboxing model.
* **[Developer Handbook / Developer Guide](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/Developer_Guide.md)**: Setup guides for Next.js App Router, writing test suites, and mock integrations.

### 1.4 Business and Governance Frameworks
* **[Platform Operating Model](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/01_platform_operating_model.md)**: Explains the product vision, target personas, and inner-source contribution models.
* **[Platform Lifecycle Governance](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/07_platform_lifecycle_governance.md)**: Defines SemVer guidelines, deprecation cadences, and feature gating.
* **[Release Engineering Framework](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/08_release_engineering_framework.md)**: Release trains, automated quality gates, and emergency hotfix paths.
* **[Security Governance Framework](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/09_security_governance_framework.md)**: Covers Zero Trust configurations, mTLS setups, SBOM policies, and compliance matrices.
* **[Data Lifecycle Policy](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/10_data_lifecycle_policy.md)**: Retention schedules, archival targets, and cryptographic shredding policies.
* **[Platform Economics Assessment](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/11_platform_economics_assessment.md)**: Cost analyses comparing local hardware CapEx with cloud SaaS OpEx.
* **[Three-Year Product Roadmap](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/13_three_year_product_roadmap.md)**: Tactical plan outlining horizons 1, 2, and 3.

---

## 2. Master Glossary

To align terminology across documents and developer teams, the following glossary is defined:

* **Aegis Core**: The foundation runtime layer containing the Platform Kernel, Event Bus, Security controller, and AI Runtime Gateway.
* **AegisOS**: The overarching sovereign enterprise platform, incorporating the core runtime, companion clients, and EIP.
* **Engineering Intelligence Platform (EIP)**: The decoupled analytics dashboard that monitors telemetry and correlates developer productivity metrics.
* **Model Context Protocol (MCP)**: An open JSON-RPC-based protocol allowing local models to retrieve file contents and execute tools in isolated sandboxes.
* **Scranton Safety Firewall**: The real-time security proxy that filters prompt injection payloads, scrubs PII, and sanitizes outgoing tokens.
* **LiteLLM**: An open-source load-balancer and router that translates standard OpenAI format calls into local Ollama endpoints.
* **Raja Knowledge Repository**: The local-first RAG knowledge vector store that hosts embeddings and performs similarity checks on context retrieval.
* **Saga Checkpoint**: A transactional database log used by the Workflow Engine to support step-level job recovery and rollbacks.
