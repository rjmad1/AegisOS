# AegisOS Mobile Command Center: Product Roadmap

* **Governing Directive**: `SCOPE_REDUCTION_DIRECTIVE_V1.md`

This document defines the phased release plan for the AegisOS Mobile Command Center, scoped to the 8 approved thin-client modules.

---

## 1. Roadmap Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRODUCT ROADMAP                               │
├────────────────────────────────────────────────────────────────────────┤
│ V1.0: Executive Command Center MVP (Months 1-3)                       │
│ mTLS Pairing, Telemetry, Chat Relay, HITL Approvals, Notifications,   │
│ Infrastructure Monitoring, Projects, Upload Center, Settings           │
├────────────────────────────────────────────────────────────────────────┤
│ V1.1: Polish & Hardening (Months 4-5)                                 │
│ Offline cache improvements, adaptive tablet layouts, performance       │
│ optimization, accessibility audit                                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Release Milestones

### V1.0.0 — Executive Command Center MVP (Months 1–3)

*   **Focus**: Establishing secure remote pairing, streaming system metrics, chat relay, signed approvals, project context switching, file uploads, and notification display.
*   **Key Capabilities**:
    *   **Secure Tunneling**: Automated Tailscale connection checks and secure device pairing via local QR code exchanges.
    *   **Executive Dashboard**: Real-time display of GPU, CPU, RAM, storage metrics, health score, service status, active models, active agents, queue depth, and critical alerts.
    *   **AI Executive Chat**: Message forwarding to workstation with streamed responses. No local memory or context.
    *   **Human Approval Center**: Biometric-gated swipe approvals. Signs command verification payloads with private keys inside the Secure Enclave.
    *   **Infrastructure Monitoring**: Drill-down views for hardware, services, models, and agents.
    *   **Notifications**: Push notification display for critical alerts, job completions, approval requests, security events, and failures.
    *   **Projects**: List and select workstation projects to set active context.
    *   **Upload Center**: Send voice, images, PDFs, documents, and URLs to the workstation.
    *   **Settings**: Connected workstations, pairing, notification preferences, theme, preferred model, VPN status.
    *   **Secure Mobile Cache**: SQLCipher local database for active telemetry snapshots and session data.
*   **Success Criteria**:
    *   Secure handshake over Tailscale in under 1.5 seconds
    *   100% of telemetry updates rendered smoothly at 5Hz
    *   Biometric signatures successfully verified by workstation
    *   File uploads complete within 5 seconds for files under 10MB
    *   All 8 modules functional and navigable

### V1.1.0 — Polish & Hardening (Months 4–5)

*   **Focus**: Production hardening, performance optimization, and multi-device support.
*   **Key Capabilities**:
    *   **Offline Resilience**: Cached telemetry snapshots shown when disconnected. Queued approvals flush on reconnect.
    *   **Adaptive Layouts**: Full foldable/tablet split-pane support with 8-column and 12-column grid layouts.
    *   **Performance**: Optimized WebSocket reconnection, battery-efficient background sync.
    *   **Accessibility**: VoiceOver/TalkBack support, minimum touch targets, contrast ratios per WCAG 2.1 AA.
*   **Success Criteria**:
    *   Smooth UI on all supported breakpoints (compact, medium, expanded)
    *   Background sync consumes < 2% battery per hour
    *   WCAG 2.1 AA compliance on all interactive elements

---

## 3. Deferred to Future Backlog

The following capabilities have been archived per the Scope Reduction Directive V1.0. They may be reconsidered for future releases pending project owner approval:

*   Self-Healing Feed & Autonomous Remediation
*   LLM Council & Critique Monitor
*   Multimodal Workspace Ingestion with edge chunking
*   Financial Intelligence Dashboard
*   On-Device SLM (Edge Compute)
*   Mobile MCP Plugins
*   Natural Language Operations (NL Ops)
*   Decentralized Cognitive Mesh

See `archive/ARCHIVE_MANIFEST.md` for the complete list.
