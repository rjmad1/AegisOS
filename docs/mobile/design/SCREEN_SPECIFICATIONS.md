# Screen Specifications

This document outlines the layouts, UI states, parameters, and operational budgets for all key screens in AegisOS Mobile.

---

## 1. QR Pairing Screen (`PairingPage`)

*   **Purpose**: Bootstraps trust and exchanges client certificates with the workstation.
*   **Layout**: Single column. Top: instructions. Center: Camera view finder frame with a glowing cyan overlay scanner. Bottom: troubleshooting link.
*   **States**:
    *   *Default*: Active camera stream searching for QR.
    *   *Loading*: Scanning complete; generating local keys and awaiting host response.
    *   *Error*: Certificate signing failed or invalid token. Display warning banner + retry.
    *   *Permissions*: Requires Camera permissions. Prompt OS dialog on entry.
*   **API Dependencies**: `POST /api/v2/mobile/auth/pair`.
*   **Performance Budget**:
    *   Pairing processing time (key generation + cert request): `< 1.5 seconds`.
    *   Frame rate: `60 fps` during camera scanning.

---

## 2. Biometric Unlock Screen (`UnlockPage`)

*   **Purpose**: Lock-gate using device hardware security to decrypt local SQLCipher key.
*   **Layout**: Center-aligned. Icon indicating FaceID/Fingerprint. Text showing "Locked - Authentication Required". Large button to trigger lock prompt.
*   **States**:
    *   *Default*: Lock-gate active.
    *   *Authenticating*: OS system biometric prompt displayed.
    *   *Error*: Match failed. Show fallback input for passcode or re-pair action.
*   **Security**: Requires iOS FaceID/TouchID plist usage description and Android `USE_BIOMETRIC` permissions.
*   **Performance Budget**: Cryptographic decryption delay on biometric success: `< 200ms`.

---

## 3. Host Dashboard Screen (`DashboardPage`)

*   **Purpose**: Real-time summary overview of the workstation status, telemetry, and pending task counts.
*   **Layout**: Scrollable grids. Top: Host status banner. Middle: row of metrics (CPU/GPU/VRAM charts). Bottom: Pending approval summary widget, active notifications list.
*   **States**:
    *   *Default*: Displays live metrics.
    *   *Loading*: Initial load. Show skeleton structures for charts.
    *   *Offline*: Display "Offline Mode" warning indicator. Retain last cached snapshot.
*   **API Dependencies**:
    *   `GET /api/v2/mobile/telemetry` (rest fallback)
    *   `GET /api/v2/mobile/sync` (pull updates)
    *   `WSS /ws/telemetry` (live 5Hz metrics)
*   **Performance Budget**:
    *   UI render time from WebSocket updates: `< 16ms` (zero frame drops).

---

## 4. AI Assistant Chat Screen (`ChatPage` & `ChatActivePage`)

*   **Purpose**: Interactive interface for prompt execution and conversation with local LLMs.
*   **Layout**: Split viewport. Upper section: conversation history list. Lower section: text field input box + attachment selector + model drop-down.
*   **States**:
    *   *Empty*: No message history. Display a grid of prompt templates (e.g. "Clean Workspace", "Check system logs").
    *   *Streaming*: LLM is responding. Stream updates token-by-token. Disable input field.
    *   *Offline*: Allow draft input. Cache message locally in Drift. Mark as "Queued" in offline actions.
*   **API Dependencies**:
    *   `GET /api/v2/mobile/chat`
    *   `SSE /sse/chat/{sessionId}` (streaming tokens)
*   **Performance Budget**:
    *   Token display update latency: `< 30ms`.

---

## 5. HITL Approvals Screen (`ApprovalsQueuePage`)

*   **Purpose**: Review and sign off on dangerous agent actions.
*   **Layout**: Card list. Swipe-left to reject, Swipe-right to approve. Tap opens detailed action sheet showing command diff, risk indicators, and execution context.
*   **States**:
    *   *Empty*: No pending approvals. Display success illustration.
    *   *Actioning*: Awaiting Secure Enclave cryptographic signature. Show spinner.
*   **API Dependencies**:
    *   `GET /api/v2/mobile/approvals`
    *   `POST /api/v2/mobile/approvals/{id}/resolve`
*   **Performance Budget**:
    *   Queue reload time: `< 300ms`.
    *   Accidental click protection (hold-to-confirm gesture timing): `1500ms`.
