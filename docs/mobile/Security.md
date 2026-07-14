# UAWOS Mobile Command Center: Security, Privacy & Data Ownership

This document details the Security Architecture, Data Ownership Model, Privacy Model, and Encryption Standards for the UAWOS Mobile Command Center.

---

## 1. Threat Model & Security Posture

As an enterprise command center controlling local system processes, files, and AI models, the application enforces a strict **Zero-Trust Security Posture**:

```
                  ┌───────────────────────────────┐
                  │      ZERO-TRUST SECURITY      │
                  └───────────────┬───────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Device Guard    │    │  Transport Guard │    │   Storage Guard  │
│  Biometric Gate  │    │  mTLS Tunnels    │    │  SQLCipher DB    │
│  Secure Enclave  │    │  E2EE Relays     │    │  Remote Wipe     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## 2. Data Ownership Model

The UAWOS system guarantees complete data sovereignty:
*   **Host Sovereignty**: All prompt inputs, LLM responses, file directories, agent logs, and codebases remain stored on physical hardware owned by the user or organization.
*   **Zero Third-Party Telemetry**: The application contains no analytics engines, crash-reporting SDKs that leak logs to third parties, or cloud tracking trackers. All telemetry remains self-contained.
*   **On-Device Cache Expiration**: The mobile application does not clone the entire workspace database. It acts as an active window, keeping a localized sliding cache of active conversations and metrics which expires based on configured retention policies (default: 7 days).

---

## 3. Privacy Model

*   **Zero-Knowledge Push Notification Relay**: Push alerts traverse the UAWOS Push Relay using an asymmetric E2E encryption scheme. The local host encrypts the payload using the mobile client's public key (stored in the host registry) before sending. The relay only routes the encrypted payload. The notification content cannot be read by the relay.
*   **Mesh VPN Confidentiality**: All internet transit outside the local Wi-Fi runs over a Tailscale/Wireguard tunnel. Telemetry, files, and chats are never routed through unencrypted public WAN nodes.

---

## 4. Workstation Pairing & mTLS Authentication

To secure the connection between the mobile device and the local AI workstation:
1.  **Initial Pairing (QR Code Exchange)**:
    *   The user generates a pairing QR code on the desktop workstation's Web Admin Console.
    *   The QR code contains the workstation's public ECDSA key, local IP/port, and a one-time cryptographic pairing challenge token.
    *   The mobile application scans the QR code, generates its own client ECDSA keypair, and transmits its public key to the workstation over a temporary TLS connection.
2.  **mTLS Connection Tunnels**:
    *   Every subsequent API, WebSocket, and SSE connection requires mutual TLS (mTLS) handshake.
    *   The workstation matches the client certificate signature against its paired device registry. If a matching key is not found, the connection is instantly closed.

---

## 5. On-Device Encryption Standards

*   **SQLCipher Databases**: The mobile device cache is managed by a SQLite database encrypted using **256-bit AES-GCM** via SQLCipher.
*   **Key Storage (Secure Enclave / KeyStore)**: The cryptographic key used to encrypt/decrypt the SQLCipher database, alongside client certificates, is stored in the device's hardware security module (iOS Secure Enclave or Android Keystore).
*   **Memory Purging**: Telemetry frames, raw token buffers, and decrypted file diffs are stored strictly in memory and are purged immediately when the view is closed or the app is backgrounded.

---

## 6. Remote De-authorization & Wipe Protocol

If a mobile device is lost or stolen:
1.  The user accesses the UAWOS Desktop Web Admin Console or runs the CLI utility on the workstation host:
    `uawos-admin client revoke --device-id [ID]`
2.  The workstation invalidates the client certificate for `[ID]` and purges the corresponding public key from the paired device registry.
3.  The next time the mobile device attempts to connect (even if the app is backgrounded), the TLS handshake is rejected, and the mobile client triggers an automatic self-wipe of the SQLCipher database cache, reverting the app to an unpaired state.
