# Master Documentation Index

Welcome to the AegisOS platform documentation repository. This directory houses the canonical, structured guides and handbooks for developers, administrators, and operators.

## Architectural Domains

### 1. Architecture & Design
* **[Architecture Handbook](Architecture_Handbook.md)**: Details the systems design, API contracts, events, and future cloud-scale topologies.
* **[Platform Handbook](Platform_Handbook.md)**: Catalog of active services, GGUF models, agents, database schemas, and plugins.
* **[Autonomic OS Transformation Master Plan](autonomic_transformation/MASTER_DELIVERABLES.md)**: Executive architectural assessment, 7-layered redesign specifications, Event Catalog, and Risk Register.
* **[Architectural Decision Records (ADRs)](../adr/)**: Direct links to all numbered design decision records (ADR-001 through ADR-013).

### 2. Infrastructure & Operations
* **[Canonical Installation & Getting Started Guide](../wiki/Install-Guide.md)**: The authoritative single source of truth for prerequisites, installation, startup, and onboarding.
* **[Deployment Guide](DEPLOYMENT.md)**: All deployment methods (local, Docker, Kubernetes, Helm) and migration procedures.
* **[Operations Guide](Operations_Guide.md)**: Runbook for logs rotation, telemetry diagnostics, and scheduled tasks.
* **[Disaster Recovery Guide](Disaster_Recovery_Guide.md)**: Backups pipeline and recovery procedures.
* **[Troubleshooting Guide](Troubleshooting_Guide.md)**: Diagnostics runbook for service failures, GPU VRAM issues, and Tailscale connection drops.

### 3. Engineering & Governance
* **[Developer Guide](Developer_Guide.md)**: Setup for the Next.js Console frontend, extending stubbed API routes, and testing.
* **[Administrator Guide](Administrator_Guide.md)**: Scopes, registry variables, Tailscale setup, and DPAPI keys management.
* **[Engineering Playbook](ENGINEERING_PLAYBOOK.md)**: The authoritative engineering operating manual for contributors, maintainers, and AI coding agents.
* **[Git Governance & Quality Assurance Standard](Git_Governance_and_QA_Standard.md)**: Defines lifecycle standards, quality gates, and security requirements for repository changes.
* **[User Guide](User_Guide.md)**: Walkthrough for managing local models, configuring editor connections, and creating plugins.

### 4. Master Implementation Program (Path to V1.0 GA)
* **[Evolution Master Implementation Program (EMIP)](EVOLUTION_MASTER_IMPLEMENTATION_PROGRAM.md)**: Authoritative platform transformation & version 1.0 GA execution plan.
* **[Master Implementation Plan](MASTER_IMPLEMENTATION_PLAN.md)**: Authoritative program governance & execution blueprint.
* **[Implementation Backlog](IMPLEMENTATION_BACKLOG.md)**: Prioritized backlog & user stories.
* **[Release Plan](RELEASE_PLAN.md)**: General Availability release train & versioning pipeline.
* **[Roadmap GA](ROADMAP_GA.md)**: Strategic capabilities, timelines & major milestones.
* **[Dependency Map](DEPENDENCY_MAP.md)**: Architectural, infrastructure, and feature dependency diagrams.
* **[Risk Register](RISK_REGISTER.md)**: Program risk assessment and mitigation matrix.
* **[Technical Debt Register](TECHNICAL_DEBT.md)**: Workstation & companion app technical debt, deprecations & deferred capabilities.
* **[GitHub Project Structure](GITHUB_PROJECT_STRUCTURE.md)**: Project boards setup, label taxonomies, and issue/PR templates.
* **[Sprint Breakdown](SPRINT_BREAKDOWN.md)**: Sprint scope, tasks, and resource effort estimates.
* **[GA Checklist](GA_CHECKLIST.md)**: Gating criteria and quality check gates for V1.0 release.

### 5. Audit & Verification Reports
* **[Audit Walkthrough](Walkthrough.md)**: Verification checklist and audit history.
* **[Optimization Roadmap](Optimization_Roadmap.md)**: Future architectural targets and pipeline upgrades.

### 6. Security
* **[Security Architecture](SECURITY_ARCHITECTURE.md)**: Defense-in-depth design with 8 security layers.
* **[Threat Model](THREAT_MODEL.md)**: STRIDE analysis across all trust boundaries.
* **[Secrets Management](SECRETS_MANAGEMENT.md)**: Secret generation, rotation, and storage policies.

### 7. Specifications & Reference
* **[Universal Execution Contract](universal_execution_contract.md)**: Core execution contract specification.
* **[Runtime Semantics Specification](runtime_semantics_specification.md)**: Runtime behavior and semantics.
* **[Capability Orchestration Blueprint](capability_orchestration_blueprint.md)**: AI capability orchestration design.
* **[Intent Resolution Planning Engine](intent_resolution_planning_engine.md)**: Intent-to-action resolution engine.
* **[Architecture Dependency Graph](architecture_dependency_graph.md)**: Component dependency relationships.
* **[Master Remediation Register](master_remediation_register.md)**: Remediation tracking and status.
* **[AI Infrastructure Context Package](reference/AI_Infrastructure_Diagram_Context_Package.md)**: Comprehensive workstation discovery and diagram generation prompts.

---

## Productization Assets
* **[CHANGELOG](../CHANGELOG.md)**: History of releases (canonical — root).
* **[VERSION](VERSION)**: Dynamic version file.
* **[LICENSE](../LICENSE)**: Distribution rights (canonical — root).
* **[CONTRIBUTING](CONTRIBUTING.md)**: Developer guidelines.
* **[CODEOWNERS](../.github/CODEOWNERS)**: Repository owners (canonical — `.github/`).
* **[SECURITY](../SECURITY.md)**: Vulnerability report guidelines (canonical — root).
* **[SUPPORT](SUPPORT.md)**: Operational support contacts.

---

## Enterprise Excellence & Governance Suite

This collection contains the standard registries, policies, risk profiles, and matrices generated by the Enterprise Architecture Board:

* **[Enterprise Assessment & Gap Matrix](enterprise/01_enterprise_gap_matrix.md)**: Gap analysis and prioritization matrix evaluating maturity across twelve operational domains.
* **[Product Management Strategy](enterprise/02_product_management.md)**: Product vision, user research, business canvas, SWOT, quarterly roadmaps, and PRD.
* **[Enterprise Governance Standard](enterprise/03_enterprise_governance.md)**: ADR registry, technology coding rules, naming guidelines, SemVer policies, and release strategies.
* **[AI Governance Framework](enterprise/04_ai_governance.md)**: Responsible AI principles, risk register, context parameters, prompt version lifecycles, and model selection criteria.
* **[Quality Engineering Framework](enterprise/05_quality_engineering.md)**: Test pyramids, DoR/DoD specifications, chaos/load testing strategies, and release quality gates.
* **[Security Governance Framework](enterprise/06_security_governance.md)**: STRIDE threat model, asset classification, RBAC matrices, SBOM rules, and compliance mappings (SOC2/ISO).
* **[Reliability & Operations Guide](enterprise/07_reliability_engineering.md)**: SLI/SLO metrics, error budgets, capacity plans, FMEAs, alert catalogs, and incident postmortem templates.
* **[Observability Standard](enterprise/08_observability_excellence.md)**: OpenTelemetry collector design, RED/USE taxonomies, tracing correlation, and structured logging.
* **[Documentation Standardization Checklist](enterprise/09_documentation_excellence_audit.md)**: Repository-wide Markdown audit and Master Glossary of system terms.
* **[Repository Knowledge Map](enterprise/10_repository_knowledge_map.md)**: Architectural Mermaid flows, capability models, and service dependencies.
* **[Bidirectional Traceability Matrix](enterprise/11_traceability_matrix.md)**: Mappings from product vision to PRD, ADRs, code, tests, and monitors.
* **[Independent Review & Findings](enterprise/12_enterprise_review_findings.md)**: Simulated architecture audit reports and remediations (Microsoft, Google, AWS, HashiCorp, Temporal, etc.).
* **[Enterprise Excellence Scorecard](enterprise/13_enterprise_readiness_scorecard.md)**: Maturity scores comparison and phase 2 code hardening priority roadmap.


## Productization, Lifecycle & Enterprise Platform Suite

This collection contains the standard architectures, guidelines, matrices, and policies created for platform productization:

* **[Platform Operating Model](productization/01_platform_operating_model.md)**: Product vision, target personas, supported use cases, governance models, and support/inner-source strategies.
* **[Product Architecture Specification](productization/02_product_architecture_specification.md)**: Detailed boundaries separating Core and EIP, and defining client companions.
* **[Platform Boundary Map](productization/03_platform_boundary_map.md)**: Architectural component boundary mapping and data flows (Mermaid).
* **[Extension Framework Specification](productization/04_extension_framework_specification.md)**: Taxonomy, metadata schema (manifest.json), auto-discovery, and sandboxed lifecycles.
* **[SDK Architecture](productization/05_sdk_architecture.md)**: APIs classification, event and error contracts, authentication/authorization, and rate limits.
* **[Enterprise Deployment Guide](productization/06_enterprise_deployment_guide.md)**: Multi-node cluster topologies, sizing guides, DR rules, and upgrade/rollback procedures.
* **[Platform Lifecycle Governance](productization/07_platform_lifecycle_governance.md)**: SemVer rules, API deprecation phases, backward compatibility guarantees, and LTS policies.
* **[Release Engineering Framework](productization/08_release_engineering_framework.md)**: Release channels, automated quality gates, hotfix processes, and rollback triggers.
* **[Security Governance Framework](productization/09_security_governance_framework.md)**: Zero Trust, identity federation, RBAC/ABAC models, mTLS certificates, SBOMs, and compliance mapping.
* **[Data Lifecycle Policy](productization/10_data_lifecycle_policy.md)**: Retention schedules, archival, deletion methods, and GDPR/HIPAA compliance rules.
* **[Platform Economics Assessment](productization/11_platform_economics_assessment.md)**: Infrastructure CapEx vs. OpEx models, local vs. cloud costs, VRAM scheduling efficiency, and ROI analysis.
* **[Product Documentation Suite](productization/12_product_documentation_suite.md)**: Index and catalog of the documentation suite, including a Master Glossary.
* **[Three-Year Product Roadmap](productization/13_three_year_product_roadmap.md)**: Three-horizon strategic roadmap spanning stabilization, distributed clustering, and autonomous operations.
* **[Platform Maturity Assessment](productization/14_platform_maturity_assessment.md)**: Maturity scoring matrix, gap analysis, and action plan to target maturity.
* **[Productization Readiness Report](productization/15_productization_readiness_report.md)**: Readiness check matrices, sign-off scorecard, issues registry, and final approval recommendation.


## Continuous Architecture & Excellence Governance (Living Reports)

The permanent continuous quality and architecture compliance runner automatically updates these reports:

* **[Engineering Excellence Dashboard](governance/engineering_excellence_dashboard.md)**: Unified high-level overview of build, compliance, and quality domains.
* **[Architecture Fitness Report](governance/architecture_fitness_report.md)**: Standard import rules check and ServiceRegistry circularity results.
* **[Operational Fitness Report](governance/operational_fitness_report.md)**: Windows services status, TCP ports, and database sizing.
* **[AI Quality Report](governance/ai_quality_report.md)**: Correctness, format adherence, safety firewall, and grounding checks.
* **[Knowledge Health Report](governance/knowledge_health_report.md)**: Markdown documentation checks, dead link audits, and index freshness.
* **[Agent Health Report](governance/agent_health_report.md)**: Agent boundaries and recursion protection validations.
* **[Model Health Report](governance/model_health_report.md)**: Active routing tables and latency/throughput metrics.
* **[Performance Report](governance/performance_report.md)**: Hardware compute and storage sizing metrics.
* **[Security Report](governance/security_report.md)**: Standard compliance controls (AC-1, CRYP-1, AUD-1, SUP-1) audits.
* **[Technical Debt Report](governance/technical_debt_report.md)**: Open remediation backlog registry.
* **[Digital Twin](governance/digital_twin.md)**: Component boundary maps and Mermaid layout.
* **[Architecture Decision Records](governance/architecture_decision_records.md)**: Quick index of design decision logs.
* **[Dependency Graph](governance/dependency_graph.md)**: Architectural component dependencies Mermaid flow.
* **[Executive Scorecard](governance/executive_scorecard.md)**: Maturity level tracker.
* **[Improvement Backlog](governance/improvement_backlog.md)**: Live prioritized task backlog.
