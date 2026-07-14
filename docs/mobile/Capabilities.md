# UAWOS Mobile Command Center: Capability Matrix & Functional Decomposition

This document presents the Capability Matrix and Functional Decomposition for the UAWOS Mobile Command Center.

---

## 1. Capability Matrix

For each functional module, the following table defines its purpose, target audience, strategic priority, system dependencies, and planned enhancements:

| Module | Purpose | Target Users | Priority | Core Dependencies | Future Enhancements |
|---|---|---|---|---|---|
| **Mission Control** | Cockpit view of infrastructure and agent health. | All Personas | P0 | AegisOS gateway connection, device-paired API. | Widget support for iOS/Android home screens. |
| **AI Assistant** | Conversational playground & command portal. | Individual, Power User, PM, Researcher | P0 | LiteLLM Routing Proxy, workstation models. | On-device model fallback, voice model streaming. |
| **Infrastructure** | Hardware and container control plane. | DevOps, SRE, Admin | P0 | Docker API, host OS metrics API, Tailscale. | Remote cluster deployment via Terraform. |
| **Models** | Model management & routing metrics. | AI Engineer, Researcher | P1 | Ollama CLI adapter, LiteLLM config registry. | Context auto-tuning based on prompt token count. |
| **Agents** | Multi-agent execution monitor & controller. | Power User, AI Engineer | P0 | AegisOS runtime, CodeGraph MCP server. | Interactive node graph visualizer. |
| **Knowledge** | Document ingestion & RAG control. | Researcher, Exec, Individual | P1 | Raja Knowledge Repository, SQL database. | Graph database visualization (Neo4j/MCP). |
| **Notifications** | Direct alerts & secure broker. | All Personas | P0 | UAWOS E2EE Push Relay. | Smart summary notifications (Ponytail group logs). |
| **Human Approval** | Gatekeeper for sensitive agent tool tasks. | All Personas | P0 | AegisOS security middleware, FCM/APNs. | Multi-sig team approvals for enterprise paths. |
| **Automation** | Schedule-based pipelines & triggers. | DevOps, SRE | P2 | Background jobs queue, workflow configuration. | Dynamic trigger compilation via natural language. |
| **Monitoring** | Time-series telemetry visualization. | DevOps, SRE, AI Engineer | P0 | OmniRoute performance collector, Prometheus. | Predictive GPU overheat and queue throttle alerts. |

---

## 2. Functional Decomposition

The systems and subsystems are decomposed into features, sub-features, and user actions below.

### Subsystem 1: Mission Control (Client Ingress Layer)
*   **System**: UAWOS Mobile Client
*   **Subsystem**: Dashboard & Overview
*   **Feature**: Real-Time Status Widgets
    *   **Sub-feature**: GPU Metrics Card
        *   *Action*: Tap card to open detailed time-series charts.
        *   *Action*: Swipe card to reveal quick-cooling trigger command.
    *   **Sub-feature**: Agent Summary Bubble
        *   *Action*: Long-press bubble to pause all active agents.
        *   *Action*: Tap bubble to open Agents tab.
    *   **Sub-feature**: Connection Status Indicator
        *   *Action*: Tap indicator to view ping times, active interface (Wi-Fi/Tailscale), and connection certificate details.

### Subsystem 2: AI Assistant (Client Ingress Layer)
*   **System**: UAWOS Mobile Client
*   **Subsystem**: Conversation Engine
*   **Feature**: Streaming Token Chat
    *   **Sub-feature**: Model Switcher Sheet
        *   *Action*: Swipe up on chat header to reveal model dropdown.
        *   *Action*: Select new model alias (e.g., `Planner` -> `DeepSeek`).
    *   **Sub-feature**: Token Statistics Overlay
        *   *Action*: Tap message info icon to view input/output tokens, cost, and compression ratios.
    *   **Sub-feature**: Code Syntax Inspector
        *   *Action*: Tap "Copy Code" button.
        *   *Action*: Tap "Run in Remote Terminal" button to dispatch command to host.

### Subsystem 3: Human Approval (Gateway Control Layer)
*   **System**: AegisOS Gateway & Mobile Portal
*   **Subsystem**: Safety & HITL Controller
*   **Feature**: Actionable Notification Sheet
    *   **Sub-feature**: Terminal Command Inspector
        *   *Action*: Slide the "Approve Action" slider right to send signed approval certificate to AegisOS.
        *   *Action*: Tap "Reject Action" to open feedback dialog.
        *   *Action*: Enter rejection reason (e.g., "Use npm instead of yarn").
        *   *Action*: Tap "Submit Rejection" to feed reason back to Agent reasoning loop.
    *   **Sub-feature**: File Diff Viewer
        *   *Action*: Double-tap line in diff to add manual inline comment.
        *   *Action*: Swipe left to skip file modification check.
