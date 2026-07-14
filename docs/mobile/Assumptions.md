# UAWOS Mobile Command Center: Technical & Product Assumptions

This document lists the technical, user, operational, and organizational assumptions for the UAWOS Mobile Command Center project.

---

## 1. Technical & System Assumptions

1.  **Workstation Service Availability**: We assume the local AI services (Ollama, LiteLLM, AegisOS, and PostgreSQL) are active and healthy on the host workstation. The mobile client does not troubleshoot offline server hardware or power cuts directly.
2.  **Tailscale Integration**: We assume Tailscale is installed on both the mobile device and the host machine. If Tailscale is not configured, remote cellular access will be unavailable, and the app will operate strictly in offline/local LAN mode.
3.  **Network Bandwidth**: We assume a minimum bandwidth of **5 Mbps** for remote cellular connections to ensure real-time terminal metric rendering and streaming token chats.
4.  **Local SLM Fallback Execution**: We assume that if the user opts for local on-device inference (e.g., Llama-3.2-1B), the mobile device has a modern GPU (Apple A14/M1 or higher, Snapdragon 8 Gen 1 or higher) supporting WebGPU or Metal.

---

## 2. User & Behavioral Assumptions

1.  **Technical Literacy**: The target audience consists of developers, DevOps engineers, researchers, and system administrators. They understand concepts like VPNs, Git diffs, Docker containers, and model parameters.
2.  **Push Notification Permission**: We assume users will grant the application push notification permissions. If notifications are blocked, the Human-in-the-Loop (HITL) approval loop will rely on manual queue pulling when the app is active.
3.  **Local Device Trust**: We assume the user's mobile device is not jailbroken or rooted. In jailbroken environments, the integrity of the Secure Enclave / Keystore cannot be guaranteed.

---

## 3. Operational & Data Assumptions

1.  **Data Storage Capabilities**: The workstation has sufficient local storage (SSD) to cache conversational histories and manage the SQLite database registry.
2.  **No Global Cloud Routing**: There is no intermediate UAWOS-hosted cloud database mirroring chat records or personal notes. All data syncing is client-to-host direct.
3.  **Time Synchronization**: The host workstation and mobile device utilize NTP (Network Time Protocol) to ensure timestamps are aligned within a 1-second margin for conflict resolution.
