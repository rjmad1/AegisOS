# UAWOS Mobile Command Center: Decision Log (ADRs & PDRs)

This document records the architectural and product design decisions (ADRs/PDRs), trade-offs, and alignment context for the UAWOS Mobile Command Center.

---

## PDR-01: Secure Remote Connection Tunnel

*   **Status**: Approved
*   **Decision**: Use **Tailscale Mesh VPN** (Wireguard-based private mesh networks) as the primary remote connectivity tunnel.
*   **Alternatives Considered**:
    1.  *Centralized Cloud Relay*: Running a UAWOS-hosted SaaS relay server to route traffic between client and host. (Rejected: Violates local-first privacy; introduces hosting cost and single point of failure).
    2.  *Dynamic DNS & Port Forwarding*: Direct connection via user-configured public ports. (Rejected: High security risk; complex configuration for non-technical users; blocked by CGNAT).
*   **Rationale**: Tailscale is already configured in the workstation's current state assessment. It provides secure, peer-to-peer, end-to-end encrypted paths that bypass firewalls without public port exposure.
*   **Implications**: Users must install Tailscale and register both their workstation and mobile device in their private tailnet.

---

## PDR-02: Push Notification Pipeline

*   **Status**: Approved
*   **Decision**: Deploy a **Zero-Knowledge E2EE Push Relay** combined with local WebSocket fallback.
*   **Alternatives Considered**:
    1.  *Direct Background Polling*: Mobile client polls host server in background. (Rejected: Blocked by iOS system sandboxing; drains mobile battery).
    2.  *Unencrypted Firebase Relay*: Sending plain-text alerts (e.g., chat text, code path) to Firebase Cloud Messaging. (Rejected: Violates data privacy; third-party servers could read sensitive workspace data).
*   **Rationale**: The local host encrypts the notification content with the mobile client's public key (stored on host). The encrypted blob is pushed to the UAWOS notification relay. Firebase/APNs only see an encrypted payload. The mobile app decrypts the payload locally using private keys in the Secure Enclave before displaying.
*   **Implications**: Requires hosting a lightweight, open-source stateless relay service that accepts POST requests of encrypted blobs and pushes them to FCM/APNs.

---

## PDR-03: On-Device Model Execution Fallback

*   **Status**: Approved
*   **Decision**: Support **lightweight on-device model configuration** (e.g., Llama-3.2-1B via WebGPU/CoreML) for basic task planning and offline notes indexing.
*   **Alternatives Considered**:
    1.  *Server-Only Inference*: The mobile client acts strictly as a remote controller; chat is disabled when offline. (Rejected: Weakens offline UX; prevents quick search/drafting when on planes or in low-signal areas).
    2.  *Heavy Local Inference (7B+)*: Attempt to execute standard models locally. (Rejected: Memory exhaustion on mobile devices; excessive thermal throttle).
*   **Rationale**: Modern mobile NPUs are capable of running 1B parameter models at > 30 tokens/sec. This is sufficient for offline text drafting and searching local Markdown files.
*   **Implications**: Larger application package footprint if the model is bundled, or requires an opt-in download step (approx. 900MB) on first start.

---

## PDR-04: Local Cache Storage Security

*   **Status**: Approved
*   **Decision**: Secure the local device cache using **SQLCipher (AES-256)**, with key generation tied to the **Secure Enclave / Keystore** and gated by **Biometrics**.
*   **Alternatives Considered**:
    1.  *Standard SQLite + OS Keychain*: Storing database in plain text, securing credentials in Keychain. (Rejected: Plaintext database files can be extracted from backup images).
    2.  *Plaintext Cache*: No encryption for local chat files. (Rejected: Violates enterprise compliance requirements).
*   **Rationale**: SQLCipher ensures that the entire database file remains encrypted on the device storage. The encryption key is dynamically derived from credentials protected by the device's hardware-backed security chip and is only released after biometric verification.
*   **Implications**: 5-10% performance overhead on database reads/writes, which is negligible for mobile application scale.

---

## PDR-05: HITL Command Authorization Cryptographic Signatures

*   **Status**: Approved
*   **Decision**: Require **Client Certificate-Signed JSON Signatures** for all Human-in-the-Loop approvals.
*   **Alternatives Considered**:
    1.  *API Token Check*: Checking a static API token in the HTTP header. (Rejected: If the token is intercepted or copied, unauthorized devices can execute commands on the host).
    2.  *One-Time Passcode (OTP)*: Inputting a generated PIN. (Rejected: Poor user experience for quick approvals).
*   **Rationale**: During pairing, the mobile client creates an ECDSA keypair in the Secure Enclave. When the user swipes "Approve" on a task, the mobile app signs a hash of the approval request (containing command details and timestamp). The workstation host verifies this signature before executing the tool.
*   **Implications**: Protects against replay attacks and ensures that even if someone gains network access, they cannot trigger tool executions without the paired device's private key.
