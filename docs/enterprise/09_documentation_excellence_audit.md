# Documentation Audit & Standardization Registry

| Field | Value |
|---|---|
| **Document ID** | DAR-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Documentation Standard |
| **Owner** | Enterprise Documentation Architect |

---

## 1. Documentation Audit Results

We have audited the existing Markdown files in the `docs/` and root directories. The audit reviews headers, metadata tables, cross-references, Table of Contents (TOC) coverage, Mermaid diagrams validity, and self-containment:

| File Path | Metadata Header | TOC Present | Cross-Links Verified | Diagram Status | Document Status | Remediation Required |
|---|---|---|---|---|---|---|
| **[docs/README.md](file:///d:/1_Projects/AegisOS/docs/README.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Add standard header and Table of Contents (TOC). |
| **[docs/Architecture_Handbook.md](file:///d:/1_Projects/AegisOS/docs/Architecture_Handbook.md)** | ❌ No | ❌ No | ✅ Yes | ✅ Valid | **Active** | Standardize metadata block and append table of contents. |
| **[docs/Platform_Handbook.md](file:///d:/1_Projects/AegisOS/docs/Platform_Handbook.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Standardize header and link references to new enterprise modules. |
| **[docs/Deployment_Guide.md](file:///d:/1_Projects/AegisOS/docs/Deployment_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Add metadata block and operational prerequisites checks. |
| **[docs/Operations_Guide.md](file:///d:/1_Projects/AegisOS/docs/Operations_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Add standard header, author lists, and review schedule. |
| **[docs/Disaster_Recovery_Guide.md](file:///d:/1_Projects/AegisOS/docs/Disaster_Recovery_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Integrate with standard RTO/RPO tables. |
| **[docs/Troubleshooting_Guide.md](file:///d:/1_Projects/AegisOS/docs/Troubleshooting_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Append new GPU memory leak and self-healer failure scenarios. |
| **[docs/Developer_Guide.md](file:///d:/1_Projects/AegisOS/docs/Developer_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Standardize metadata block and link to quality gates. |
| **[docs/Administrator_Guide.md](file:///d:/1_Projects/AegisOS/docs/Administrator_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Add metadata, role permissions matrices, and link to RBAC guidelines. |
| **[docs/Git_Governance_and_QA_Standard.md](file:///d:/1_Projects/AegisOS/docs/Git_Governance_and_QA_Standard.md)** | ✅ Yes | ❌ No | ✅ Yes | ✅ Valid | **Active** | Maintain existing metadata but append TOC. |
| **[docs/User_Guide.md](file:///d:/1_Projects/AegisOS/docs/User_Guide.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Add standard header. |
| **[docs/Walkthrough.md](file:///d:/1_Projects/AegisOS/docs/Walkthrough.md)** | ❌ No | ❌ No | ✅ Yes | ✅ Valid | **Active** | Add standard metadata header. |
| **[docs/Technical_Debt_Assessment.md](file:///d:/1_Projects/AegisOS/docs/Technical_Debt_Assessment.md)** | ❌ No | ❌ No | ✅ Yes | N/A | **Active** | Normalize with standard metadata template. |

---

## 2. Documentation Standardization Rules

Every document in the repository must meet these five criteria to be certified as enterprise-ready:

1. **Standard Header Block**: Must contain ID, version, date, classification, owner, and review date.
2. **Self-Containment**: Documents must define their terms or reference this master glossary. Avoid placing vague code templates without explaining prerequisites.
3. **Internal Consistency**: Ensure terminology (e.g. "Workflow Engine" vs. "Orchestration Pipeline") is aligned system-wide.
4. **Clickable Relative Links**: All file and code paths must be absolute relative references using standard Markdown syntax.
5. **Mermaid Formatting**: All diagrams must use standard syntax without HTML tags.

---

## 3. Platform Master Glossary

To ensure alignment across engineering, product management, and compliance teams:

* **Platform Kernel**: The core service container governing the lifecycle of all workstation modules and routing communication events.
* **Agent**: An autonomous software process combining system instructions, prompt models, and tool invocation registries to execute user tasks.
* **Tool / Plugin**: Extensible functions or external APIs (e.g. MCP servers, database queries, terminal commands) that can be invoked by agents.
* **Workflow Engine**: The background state machine that schedules and executes event-driven or cron-driven pipelines.
* **Saga Checkpoint**: Serialized state checkpoints written to the database before and after workflow steps to allow recovery from system restarts.
* **hardenedEventBus**: The server-side event streaming engine implementing dead letter queues and audit logging.
* **EventBus**: The browser-side event emitter coordinating UI updates and Toast notifications.
* **Grounding**: The process of anchoring LLM prompts in verified reference documents (such as RAG database files) to prevent hallucinations.
* **Model Manifest**: The structured JSON registry defining local model paths, configuration limits, and required capabilities.
* **Self-Healer**: The background daemon monitoring workstation directories, network ports, and memory bounds, and applying automated repairs.

---

## 4. Platform Acronym Registry

| Acronym | Definition | System Domain |
|---|---|---|
| **ADR** | Architecture Decision Record | Architecture |
| **DoD** | Definition of Done | Quality Engineering |
| **DoR** | Definition of Ready | Quality Engineering |
| **DLQ** | Dead Letter Queue | Messaging / Event Bus |
| **DPAPI**| Data Protection Application Programming Interface | Security |
| **FMEA** | Failure Modes and Effects Analysis | Reliability |
| **JTBD** | Jobs-to-be-Done | Product Management |
| **MCP**  | Model Context Protocol | AI Infrastructure |
| **OTel** | OpenTelemetry | Observability |
| **PRD**  | Product Requirements Document | Product Management |
| **RAG**  | Retrieval-Augmented Generation | AI Infrastructure |
| **RCA**  | Root Cause Analysis | Incident Management |
| **RPO**  | Recovery Point Objective | Reliability |
| **RTO**  | Recovery Time Objective | Reliability |
| **SLA**  | Service Level Agreement | Reliability |
| **SLI**  | Service Level Indicator | Observability |
| **SLO**  | Service Level Objective | Observability |
| **SSE**  | Server-Sent Events | Web API / Realtime |
| **TAM**  | Total Addressable Market | Product Management |
| **TOC**  | Table of Contents | Documentation |
| **WORM** | Write Once Read Many | Security / Archiving |
