# UAWOS Mobile Command Center: Detailed Requirements

This document specifies the Functional (FR) and Non-Functional (NFR) requirements for the UAWOS Mobile Command Center application.

---

## 1. Functional Requirements (FR)

The functional capabilities of the mobile application are divided into six primary domains:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FUNCTIONAL DOMAINS                              │
├──────────────────────────────────┬─────────────────────────────────────┤
│ FR-1: Connection & VPN           │ FR-4: Agent Orchestration           │
│ FR-2: Dashboard & Telemetry      │ FR-5: Notifications & Approvals     │
│ FR-3: AI Assistant & Chat        │ FR-6: Security & Device Admin       │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### FR-1: Connection & VPN Management
*   **FR-1.1**: The application shall automatically detect local workstation instances of UAWOS using mDNS (multicast DNS) when connected to the same Wi-Fi network.
*   **FR-1.2**: The application shall support manual configuration of connection endpoints (IP address, hostnames, and custom ports).
*   **FR-1.3**: The application shall integrate with Tailscale VPN API to programmatically verify, start, or stop VPN tunnels to access localhost-bound services.
*   **FR-1.4**: The application shall execute a mutual TLS (mTLS) handshake using device-specific certificates generated via a one-time QR code scan during pairing.

### FR-2: Monitoring & Telemetry Dashboard
*   **FR-2.1**: The application shall display real-time hardware telemetry from the host machine: GPU utilization %, VRAM consumption, CPU load, RAM usage, and temperatures.
*   **FR-2.2**: The application shall render active request queues, listing queued prompts, routing decisions, and current queue latency.
*   **FR-2.3**: The application shall display system service logs (Ollama, LiteLLM, AegisOS, OmniRoute) in a filterable, search-friendly terminal inspector.
*   **FR-2.4**: The application shall display the currently loaded models, their size, parameter counts, and status (Active, Idle, Unloaded).

### FR-3: AI Assistant & Chat
*   **FR-3.1**: The application shall support streaming token responses via WebSocket or Server-Sent Events (SSE).
*   **FR-3.2**: The application shall allow the user to select, swap, or configure model profiles mid-conversation (e.g., switching from Gemma-9B to DeepSeek-32B).
*   **FR-3.3**: The application shall display token consumption metrics (Input, Output, Saved, Prompt Cache Hit %) for every response.
*   **FR-3.4**: The application shall render Markdown, code syntax highlighting, mathematical equations (LaTeX), and rich inline media.

### FR-4: Agent Orchestration & Workspace
*   **FR-4.1**: The application shall display active background agent workflows, showing step-by-step logs, current status (running, paused, waiting, completed, failed), and task execution plans.
*   **FR-4.2**: The application shall provide control triggers to Pause, Resume, Throttle (reduce execution rate), or Kill active agent processes.
*   **FR-4.3**: The application shall allow the user to launch pre-defined workflow templates directly from the mobile app (e.g., code audits, system health checks, data cleaning).

### FR-5: Notifications & Human-in-the-Loop (HITL) Approvals
*   **FR-5.1**: The application shall display a dedicated "Pending Approvals" tab containing agent requests that require human authorization.
*   **FR-5.2**: Approval cards shall include: requesting agent ID, target action (e.g., executing terminal command `npm run build`), sensitive data accessed, risk rating, and option to Approve or Reject.
*   **FR-5.3**: The application shall support actionable push notifications, allowing users to Approve or Reject tasks directly from their lock screen.
*   **FR-5.4**: The application shall support adding feedback strings when rejecting a request, passing user notes back to the agent reasoning loop.

### FR-6: Security & Device Administration
*   **FR-6.1**: The application shall enforce biometric authentication (FaceID, TouchID, or Android Biometric Prompt) on app startup and session resumption.
*   **FR-6.2**: The application shall support remote wipe commands: if a device is reported lost, the UAWOS host can invalidate the client certificate, preventing future connections.

---

## 2. Non-Functional Requirements (NFR)

### NFR-1: Performance & Latency
*   **NFR-1.1**: The mobile application UI thread must maintain **60 FPS** (or 120Hz on supported screens) during telemetry rendering and streaming token display.
*   **NFR-1.2**: Token rendering latency must be **< 30ms** from packet reception to screen redraw to prevent jitter.
*   **NFR-1.3**: The application package footprint shall be **< 50MB** for initial download.

### NFR-2: Reliability & Resilience
*   **NFR-2.1**: The app must handle sudden network drops gracefully. It shall buffer chat inputs locally and automatically retry reconnection using exponential backoff (starting at 1s, doubling up to 30s).
*   **NFR-2.2**: If the host connection is lost mid-stream, the app must retain the partial stream state and resume displaying tokens from the last received offset when connection is restored.

### NFR-3: Security & Data Privacy
*   **NFR-3.1**: **E2E Encryption**: All client-host data transit must occur over TLS 1.3. Telemetry and chat payloads must not traverse intermediate unencrypted proxy servers.
*   **NFR-3.2**: **Encrypted Cache**: On-device conversation caches, API tokens, and certificate keys must be stored in a local SQLite database encrypted with 256-bit AES via SQLCipher.
*   **NFR-3.3**: **Biometric Lockout**: The app must automatically lock and blur screen content if backgrounded for more than **30 seconds**.

### NFR-4: Design System & Compatibility
*   **NFR-4.1**: The UI must adapt seamlessly across screen configurations: compact phones, medium foldables (detecting fold/hinge states to split UI), and expanded tablets (showing navigation rail + dashboard).
*   **NFR-4.2**: The design system must support dynamic system themes (Light/Dark mode integration, matching iOS system themes and Android Material You dynamic color schemes).

### NFR-5: Accessibility (WCAG 2.2)
*   **NFR-5.1**: The application UI must achieve **WCAG 2.2 AAA** compliance for contrast ratios (minimum 7:1 for text, 4.5:1 for large text).
*   **NFR-5.2**: The app must fully support Screen Readers (VoiceOver on iOS, TalkBack on Android) with proper accessibility labels, roles, and focus orders.
*   **NFR-5.3**: The application must respect system font size scales (Dynamic Type) without clipping layout components.
