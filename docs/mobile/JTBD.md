# UAWOS Mobile Command Center: Jobs-To-Be-Done (JTBD) & Pain Points

This document details the Jobs-To-Be-Done (JTBD) framework and maps critical user pain points to technical solutions in the mobile application.

---

## 1. Jobs-To-Be-Done (JTBD)

We define the product requirements around the key jobs users hire UAWOS Mobile to perform:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CORE JOBS TO BE DONE                          │
├────────────────────────────────────────────────────────────────────────┤
│ Job 1: Remote Workstation Control                                      │
│ "When I am away from my desk, I want to securely monitor and regulate  │
│ my local GPU workstation, so I can ensure my background AI runs are    │
│ progressing without overheating or running out of VRAM."               │
├────────────────────────────────────────────────────────────────────────┤
│ Job 2: Interactive Agent Mentorship                                    │
│ "When an autonomous agent reaches a decision boundary, I want to       │
│ inspect its proposed actions and give feedback, so that I can unblock  │
│ its workflow without returning to my computer."                        │
├────────────────────────────────────────────────────────────────────────┤
│ Job 3: Secure Privacy-First Assistant                                  │
│ "When I need to draft sensitive documents or analyze company data,     │
│ I want to use a powerful LLM, so that I can maintain absolute data     │
│ privacy without leaking data to third-party APIs."                     │
└────────────────────────────────────────────────────────────────────────┘
```

### Job 1: Remote Workstation Control
*   **Situation**: User is commuting or out for lunch while their GPU workstation is running a batch code-index job.
*   **Motivation**: They want to make sure the machine isn't thermal throttling or locking up.
*   **Expected Outcome**: Real-time telemetry, clear VRAM statistics, and a simple toggle to pause jobs remotely.

### Job 2: Interactive Agent Mentorship
*   **Situation**: A developer launches an agent to write tests for a legacy system. The agent needs to verify if it can overwrite a file.
*   **Motivation**: The developer wants to review the target file path and code diff from their phone immediately, rather than letting the agent fail or wait until the next morning.
*   **Expected Outcome**: A high-priority push notification containing the diff and action buttons, resolving the block in seconds.

### Job 3: Secure Privacy-First Assistant
*   **Situation**: An executive is in a meeting and needs to summarize a confidential financial PDF.
*   **Motivation**: They must not upload the PDF to public cloud servers like OpenAI due to strict corporate compliance.
*   **Expected Outcome**: They send the PDF to their local UAWOS instance via their phone over Tailscale VPN, where the workstation processes the PDF locally and streams the summary securely to the mobile screen.

---

## 2. Pain Points & Mapped Solutions

| Pain Point | User Consequence | UAWOS Mobile Technical Solution |
|---|---|---|
| **Unreliable Cellular Connection** | Loss of streaming tokens, chat disconnects, frozen terminal metrics. | **Connection Buffering & SSE Resume**: Local client caches conversational inputs and server-sent metrics. Reconnections resume from the last-received message offset. |
| **High Battery/Data Consumption** | Background WebSocket connections drain battery and consume cellular data. | **Intelligent Telemetry Throttling**: Reduces telemetry frame updates from 10Hz to 1Hz when the app is backgrounded. Auto-switches to long-polling when cellular data saver is enabled. |
| **Approval Alert Fatigue** | Users get flooded with notifications for simple agent tools. | **Orchestration Rules Engine**: Allows defining trust levels for specific MCP tools (e.g., auto-approve `git diff`, but require manual approval for `git push` or shell execution). |
| **Complex VPN Management** | Connecting to local loopback ports requires manual configuration of keys. | **Integrated Tailscale Helper**: Handshakes with Tailscale API directly from the app, toggling the tunnel automatically based on network location (Local Wi-Fi vs. Cell). |
| **Form Factor Incompatibility** | UI scales poorly, text is truncated, and dashboards break on folding screens. | **Adaptive Multi-Pane Rails**: The app detects foldable hinges and tablet widths, switching from tab views to split-pane navigation Rails. |
