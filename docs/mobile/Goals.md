# UAWOS Mobile Command Center: Goals & Success Metrics

This document defines the Strategic Product Goals and technical Success Metrics (across SRE, UX, Security, and Business domains) for the UAWOS Mobile Command Center.

---

## 1. Strategic Product Goals

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STRATEGIC PRODUCT GOALS                         │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Unified Mobile Command Pane                                         │
│    Unify monitoring, model orchestration, agent runs, and conversations│
│    into a single adaptive interface.                                   │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Frictionless Remote Access                                          │
│    Provide secure, instant remote access to localhost-bound runtimes    │
│    via mesh networks (Tailscale/Wireguard) without exposing ports.      │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Human-in-the-Loop Orchestration                                     │
│    Implement a high-priority approval queue that allows users to       │
│    authorize agent tool execution on the go.                           │
├────────────────────────────────────────────────────────────────────────┤
│ 4. Local-First & Privacy Sovereign                                     │
│    Ensure that all communication is end-to-end encrypted, and all      │
│    on-device caches are fully protected.                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Success Metrics

### A. SRE & Technical Performance Metrics
*   **Establishment Latency (VPN)**: Reconnecting to the local host over Tailscale VPN from a cellular network must take **< 1,500ms** from cold start.
*   **Websocket Propagation Latency**: Message transit (e.g., token streams, metrics updates) between local gateway and mobile app must be **< 150ms** under standard network conditions.
*   **App Cold Start**: Core UI interactivity must load in **< 400ms** on modern devices (iOS/Android).
*   **Local Query Latency (SQLCipher)**: Querying the encrypted local state database must be **< 15ms** for 99% of read operations.
*   **Device Battery Consumption**: Background monitoring over WebSocket must not exceed **2% battery drain per hour** of active background usage.

### B. User Experience (UX) & Product Metrics
*   **Approval Response Time**: The average time taken for a user to review and action an agent approval notification should be **< 5 seconds** for active sessions.
*   **Session Resumption Rate**: Successful reconnection and log stream resumption for running agents must be **> 98%** when switching from cellular to local Wi-Fi.
*   **Multi-Platform UI Rating**: Maintain a unified layout experience scoring **> 4.8/5.0** in cross-platform UI usability reviews, ensuring foldables and tablets display dense, uncompromised dashboards.
*   **System Telemetry Scannability**: Ensure 100% of crucial GPU/VRAM statistics are visible on a single scroll-free dashboard fold on mobile devices.

### C. Security & Data Privacy Metrics
*   **Zero Leakage (Data Sovereignty)**: Exactly **0%** of prompt text, model inputs, agent logs, or local file names may be transmitted to or stored on unencrypted, third-party cloud servers.
*   **E2EE Verification**: **100%** of remote push notifications must be encrypted with the mobile device's public key at the local host before transit.
*   **Biometric Fail-Safe**: Immediate app lock and local database encryption key purge must occur on **100%** of failed biometric authorization attempts.

### D. Business & Platform Value Metrics
*   **Workspace GPU Utilization**: Remotely queued background jobs and workflows must increase workstation GPU duty-cycle utilization by **> 30%** (by keeping models busy when the developer is away from their desk).
*   **Agent Task Completion Rate**: Improve the overall success rate of complex multi-hour agent workflows by **25%** by allowing operators to unblock agents remotely via HITL mobile inputs.
