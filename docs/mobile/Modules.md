# UAWOS Mobile Command Center: Functional Modules

This document details the system-wide Functional Modules that comprise the UAWOS Mobile Command Center application, describing the role and scope of each.

---

## 1. Module Architecture Overview

The UAWOS Mobile Command Center is structured into modular subsystems to maintain separation of concerns, high responsiveness, and smooth code maintenance.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE FUNCTIONAL MODULES                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Mission Control   │ AI Assistant      │ Infrastructure                 │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Models            │ Agents            │ Knowledge                      │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Notifications     │ Human Approval    │ Automation & Workflows         │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Monitoring        │ Analytics         │ Security & Settings            │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Voice & Search    │ Timeline & Memory │ Administration & Remote Access │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ Files & Devices   │ Plugins & Market  │ Integrations & Enterprise      │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Module Directory & Scope

### 1. Mission Control
*   **Purpose**: The default launch screen of the application.
*   **Scope**: Aggregates high-priority telemetry, active agent counts, pending approvals, connection status, and quick action widgets. It provides a cockpit view of the entire local AI ecosystem.

### 2. AI Assistant (Chat)
*   **Purpose**: Conversational AI playground.
*   **Scope**: Chat interface supporting model switching, streaming response tokens, text and voice input, attachment handling, prompt preset injection, and inline code/markdown rendering.

### 3. Infrastructure
*   **Purpose**: Resource topology manager.
*   **Scope**: Lists physical hosts, workstations, and auxiliary edge devices running Ollama or database layers. Exposes container statuses (Docker), SCM services (LiteLLM, AegisOS, OmniRoute), and ports.

### 4. Models
*   **Purpose**: Model registry and control.
*   **Scope**: Manages the local model library. Allows downloading/pulling new models, deleting models, loading models into VRAM, configuring context windows, temperature, and monitoring active routing paths.

### 5. Agents
*   **Purpose**: Agent control room.
*   **Scope**: Lists active and historical agent instances (e.g., CodeGraph agent, research runner). Displays live execution graphs, tool execution history, and console logs. Allows pausing, resuming, throttling, or killing runs.

### 6. Knowledge
*   **Purpose**: Context retrieval and RAG coordinator.
*   **Scope**: Manages semantic vector stores, folder sync paths, and documentation indexers. Shows index status, storage size, and chunk details, and allows triggering manual indexing runs.

### 7. Notifications
*   **Purpose**: Pager and event broker.
*   **Scope**: Receives and displays E2EE pushes regarding system faults, model load failures, agent task completions, and authentication requests.

### 8. Human Approval (HITL)
*   **Purpose**: Human-in-the-loop task gatekeeper.
*   **Scope**: High-priority interactive queue. Pauses agent runs when a sensitive tool (filesystem write, shell command, github push) is triggered, requesting user authorization, swipe approvals, or voice-recorded overrides.

### 9. Automation & Workflows
*   **Purpose**: Custom cron and sequence execution.
*   **Scope**: Schedules recurring automated tasks (e.g., nightly backups, codebase audits, doc generation) and configures linear/graphical task pipelines.

### 10. Monitoring & Analytics
*   **Purpose**: Performance telemetry and logs.
*   **Scope**: Displays time-series line graphs, charts, and gauge dials representing GPU/VRAM load, response latency, token throughput, cache hits, and error rates. Supports log auditing and log exports.

### 11. Security & Settings
*   **Purpose**: System hardening and configuration.
*   **Scope**: Manages client certificates, API keys, Tailscale connection state, biometric access locks, local SQLCipher DB wipe controls, and UI theme customizations.

### 12. Voice
*   **Purpose**: Hands-free conversation and control.
*   **Scope**: Speech-to-text (Whisper/local dictation) and text-to-speech (TTS) playback engine. Supports hands-free "wake word" command detection when app is in foreground.

### 13. Search
*   **Purpose**: Unified global command search.
*   **Scope**: A Raycast-like command palette. Search terms query active chats, agent logs, model details, files, knowledge catalogs, and app commands in a single interface.

### 14. Timeline & Memory
*   **Purpose**: Historical event log and agent memory editor.
*   **Scope**: Visual timeline of all tasks, agent executions, and edits. Allows inspecting and purging long-term semantic memory entries compiled by agents (e.g., user preferences).

### 15. Administration & Remote Access
*   **Purpose**: VPN and cluster administration.
*   **Scope**: Manages remote mesh nodes, network tunnels, SSH shortcuts to workstations, and reboot/shutdown commands for local servers.

### 16. Files
*   **Purpose**: Remote file manager.
*   **Scope**: Browse, inspect, upload, or download files from workspace folders mapped to the filesystem MCP server. Includes syntax highlighted code previewer.

### 17. Devices
*   **Purpose**: Mobile client pairing manager.
*   **Scope**: Lists paired mobile devices (phones, tablets), showing registration certificates, last sync time, and authorization tokens.

### 18. Plugins & Marketplace
*   **Purpose**: MCP and tool extension explorer.
*   **Scope**: Browse, install, update, and configure Model Context Protocol (MCP) servers and agent toolsets.

### 19. Integrations & Enterprise
*   **Purpose**: Corporate deployment configuration.
*   **Scope**: Configures SSO authentication (OIDC, SAML), corporate proxy settings, organization-wide policy controls, audit log exports, and multi-user access permissions.
