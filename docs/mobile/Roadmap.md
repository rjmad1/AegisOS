# UAWOS Mobile Command Center: Product Roadmap

This document defines the phases, releases, and milestones for the UAWOS Mobile Command Center.

---

## 1. Roadmap Phasing Overview

Our roadmap is structured into three primary releases to systematically establish stable connectivity, expand agent control, and eventually enable edge intelligence.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRODUCT ROADMAP                               │
├────────────────────────────────────────────────────────────────────────┤
│ V1: Establish Command & Control (Months 1-3)                          │
│ Core Connection (Tailscale), Telemetry, Chat SSE, HITL Approvals.      │
├────────────────────────────────────────────────────────────────────────┤
│ V2: Agent Swarms & Workspace (Months 4-6)                              │
│ Node Graph, Model Management, Multi-Host Support, Rule-based Approvals.│
├────────────────────────────────────────────────────────────────────────┤
│ V3: Offline Edge & Plugins (Months 7-9)                                │
│ On-device SLM execution, Deep RAG Browser, Mobile MCP plugins.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Release Milestones

### V1.0.0 — Command, Control & HITL (Months 1–3)
*   **Focus**: Establishing a secure link and providing primary command-and-control features.
*   **Key Capabilities**:
    *   **Secure Tunneling**: Automated Tailscale VPN state validation and pairing via secure local QR code exchange.
    *   **Telemetry Panel**: Real-time display of GPU, VRAM, and RAM metrics at 5Hz using WebSockets.
    *   **Streaming Chat**: SSE token stream with markdown and code rendering.
    *   **Approvals Queue**: Human-in-the-loop approval cards for critical file and shell commands.
    *   **Mobile Security**: On-device encryption (SQLCipher) and biometric locks (FaceID/Fingerprint).
*   **Success Criteria**: Stable connection over cellular VPN in under 1.5 seconds; 100% of telemetry updates rendered smoothly at 60fps.

### V2.0.0 — Agent Workspace & Orchestration (Months 4–6)
*   **Focus**: Rich agent inspection, task scheduling, and rule-based workflow delegation.
*   **Key Capabilities**:
    *   **Node Graph Inspector**: Visualizing multi-agent runs as interactive dependency trees.
    *   **Model Manager**: Downloading, unloading, and re-routing models directly from the client.
    *   **Multi-Host Aggregations**: Switching between home workstation, office cluster, and private cloud.
    *   **Rule-based HITL**: User-defined rules for auto-approving low-risk agent tool calls (e.g., auto-approve read tools).
    *   **SCM Terminal logs**: Direct view of LiteLLM/Ollama server log stdout.
*   **Success Criteria**: Average approval task response time reduced by 50% through auto-approval configurations.

### V3.0.0 — Local Edge & Plugin Extension (Months 7–9)
*   **Focus**: Offline independence and extending mobile workspace capabilities.
*   **Key Capabilities**:
    *   **On-Device Inference**: Compiling and running lightweight models (e.g., Llama-1B, smollm-135m) directly on the device GPU via CoreML/WebGPU for offline note search.
    *   **RAG Browser**: Detailed semantic search and metadata lineage navigator over the Raja Knowledge Repository.
    *   **Mobile MCP Integrations**: Exposing mobile-native device interfaces (e.g., Contacts, GPS location, Calendar) as local MCP context servers to the host workstation.
    *   **Voice Streaming**: Continuous speech-to-text input with low-latency audio response.
*   **Success Criteria**: 100% functionality of local searching and message drafting available when offline.

---

## 3. Future Vision (10+ Months)

In the long term, UAWOS Mobile will shift from being a remote control for a desktop workstation to becoming an independent, cooperative node in a **Decentralized Cognitive Mesh**. Multiple mobile clients will share task processing duties, delegating lightweight jobs to local edge devices while routing large-scale reasoning tasks to local GPU clusters or private data center networks.
