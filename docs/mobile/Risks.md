# UAWOS Mobile Command Center: Risks, Assumptions & Constraints

This document details the Project Risks, Technical Assumptions, and Architectural Constraints for the UAWOS Mobile Command Center application.

---

## 1. Risk Assessment & Mitigation Matrix

We identify the following critical engineering, operational, and product risks, along with their respective mitigation plans:

| Risk Domain | Risk Description | Severity | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **Connectivity** | VPN connection drops or fails over cellular networks, leaving the user without remote command ability. | High | High | **Dual Connection Tunnels**: Support automatic switching between direct LAN and Tailscale VPN interfaces. Provide offline queueing of non-critical commands. |
| **Performance** | Real-time WebSocket logs and charts consume excessive battery and device memory. | Medium | High | **Dynamic Telemetry Throttling**: Adapt sync rate based on app state (active vs. backgrounded) and battery level. Buffer log outputs in chunks. |
| **Security** | Theft or loss of a paired mobile device, exposing administrative control over local networks and files. | High | Low | **Hardware Cryptography & Remote Revocation**: Store authentication keys in Secure Enclave. Enable immediate device certificate revocation and remote data wipe. |
| **App Store Policies** | App store rejection (APNs rules, sandboxing restrictions, or direct code execution controls on iOS/Android). | Medium | Medium | **Gateway Execution separation**: The app never executes arbitrary shell scripts *locally* on the mobile device. It only dispatches signed approval tokens to the remote workstation. |
| **Resource Contention** | Heavy agent runs triggered from mobile crash the workstation host due to out-of-memory (OOM) errors. | High | Medium | **Resource Throttling**: Implement workstation-side safety policies that reject or queue agent requests if GPU VRAM load is > 90%. |

---

## 2. Technical Assumptions

To deliver a reliable product definition, we establish the following base assumptions:
1.  **Workstation Infrastructure**: The user has a running instance of UAWOS containing AegisOS, LiteLLM, and Ollama, bound to localhost interfaces (`127.0.0.1`).
2.  **Tailscale Account**: The user operates a Tailscale account (or equivalent private Wireguard network) and has configured the workstation and mobile client as nodes in the same mesh network.
3.  **Local Hardware Capability**: The host workstation contains an active NVIDIA GPU (with CUDA support) capable of running target models (minimum 8GB VRAM for 7B-9B parameter models).
4.  **Device Capabilities**: The mobile device has biometric hardware (FaceID/TouchID or Android Biometric Prompt) and a hardware-backed security module (Secure Enclave or Keystore).

---

## 3. System & Design Constraints

*   **iOS Sandboxing**: The iOS application cannot run background processes indefinitely. Long-running WebSocket sync is restricted, requiring reliance on remote E2EE Push Notifications for background events.
*   **Android Battery Optimization**: Android's Doze Mode will pause background WebSocket polling, necessitating integration with Android WorkManager for scheduled sync passes.
*   **VRAM Allocation Limit**: Since Ollama dynamically unloads idle models, the mobile app must handle delay times (up to 5-10 seconds) when a model is being read into GPU memory from storage.
*   **UI Screen Density**: Telemetry charts must fit compact mobile screen footprints (minimum width of 320dp) without cropping visual indicators or labels.
