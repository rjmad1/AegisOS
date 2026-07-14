# AegisOS Implementation Backlog
**Prioritized Backlog & User Stories (Path to V1.0 GA)**

This document defines the product backlog, structured hierarchically from Capability Areas down to individual User Stories and Tasks. It specifies priorities, strict dependencies, Acceptance Criteria (AC), and Definitions of Done (DoD).

---

## 1. Backlog Taxonomy & Definitions
Each backlog item is designated with:
* **Priority**: Critical (P0), High (P1), Medium (P2), Low (P3).
* **Dependencies**: Previous items that must be completed and merged.
* **Definition of Done (DoD)**: Standard criteria (unit tests passing, documentation updated, code reviewed, static analysis clean) in addition to specific criteria.

---

## 2. Prioritized Capability Backlog

### Capability Area A: Zero-Trust Connection & Security
Focuses on mTLS tunneling, device registration, and Secure Enclave cryptographic verification.

#### Story SEC-1: Secure Device Pairing & Certificate Exchange (P0)
* **Description**: As a new operator, I want to pair my mobile client with the workstation host by scanning a QR code, so that an mTLS tunnel is securely established.
* **Dependencies**: None (Sprint 0 Baseline).
* **Acceptance Criteria**:
  1. Scanning the host pairing QR code extracts the host domain/IP and initial pairing secret.
  2. Mobile client generates an ECDSA key pair within the iOS Secure Enclave / Android KeyStore.
  3. Client executes a certificate signing request (CSR) to the host CA.
  4. Workstation issues the client certificate and stores it in the client's secure storage.
* **Definition of Done**: 
  * 100% test coverage on `SecureEnclaveKeyGenerator` and `CsrPayloadBuilder`.
  * CSR exchange verified via integration test using mock host API.
  * Verified that private keys cannot be extracted from hardware storage.

#### Story SEC-2: Biometric App Locking & Lifecycle Protection (P1)
* **Description**: As a security-conscious user, I want the mobile application to prompt for biometrics (FaceID/Fingerprint) on launch or when returning from the background, so that my local command panel remains protected.
* **Dependencies**: SEC-1.
* **Acceptance Criteria**:
  1. Biometric lock triggers on initial cold boot and after 30 seconds of background state.
  2. Fallback to device PIN/passcode when biometrics fail.
  3. Application memory is purged of sensitive session variables on backgrounding.
* **Definition of Done**:
  * Simulated background/foreground state transitions verify lock triggers.
  * Golden test validates the biometric gate overlay screen.

---

### Capability Area B: Local Orchestration Monitoring
Covers real-time host status, GPU/VRAM gauges, and docker service controls.

#### Story MON-1: Real-Time Telemetry Gauges (P0)
* **Description**: As a system administrator, I want to view real-time GPU/VRAM, CPU, and RAM metrics from my workstation on a dashboard, so that I can monitor model execution overhead.
* **Dependencies**: SEC-1.
* **Acceptance Criteria**:
  1. Mobile client establishes a WebSocket connection to `/ws/telemetry`.
  2. Telemetry payloads render at 5Hz with smooth visual transitions.
  3. Out-of-bounds metrics (e.g., GPU temp > 85°C) trigger warning UI states.
* **Definition of Done**:
  * Socket reconnection logic verified under simulated packet loss (cellular drift).
  * Gauges conform to the Material 3 Slate-Indigo palette specifications.

#### Story MON-2: Workstation Service Controller (P1)
* **Description**: As a developer, I want to view the status of host services (Ollama, LiteLLM, Postgres, Redis) and restart them, so that I can resolve host service hangs from my phone.
* **Dependencies**: MON-1.
* **Acceptance Criteria**:
  1. Renders a grid of all system-managed host services with uptime.
  2. Allows trigger actions ("Restart", "Stop") for services with administrative validation.
* **Definition of Done**:
  * Restart triggers verified on host mock REST endpoint `/api/v2/mobile/services/:id/restart`.

---

### Capability Area C: AI Assistant & Knowledge
Focuses on SSE token streaming, chat sessions, model management, and knowledge indexing.

#### Story AI-1: SSE Streaming Chat & Markdown Rendering (P0)
* **Description**: As an operator, I want to chat with local models and see token streams render in real-time, so that I have a highly responsive assistant interface.
* **Dependencies**: SEC-1.
* **Acceptance Criteria**:
  1. Establishes Server-Sent Events (SSE) stream on `/sse/chat`.
  2. Renders Markdown text, code blocks (with syntax highlighting), and tables on-the-fly.
  3. Tokens stream at a minimum of 30 tokens/sec without frame drops (60fps).
* **Definition of Done**:
  * Profile testing validates no memory leaks on long conversation threads (>100 messages).
  * UI verified on foldable and narrow-screen devices.

#### Story AI-2: Host Model Registry & Switcher (P1)
* **Description**: As a principal architect, I want to list available local GGUF models, download new weights, and hot-swap active models during a chat session, so that I can manage workstation compute resources.
* **Dependencies**: AI-1.
* **Acceptance Criteria**:
  1. Queries `/api/v2/mobile/models` to display downloaded models and active models in VRAM.
  2. "Switch Model" command sends request to host to unload/load models in Ollama/LiteLLM.
  3. Displays download progress bar when downloading new model weights.
* **Definition of Done**:
  * Switching VRAM model verified through integrated API logs.

---

### Capability Area D: Human-in-the-Loop (HITL) Operations
Enables the command approval queue, cryptographic signing, and remote terminal executions.

#### Story HITL-1: Secure Approval Queue & Swiping (P0)
* **Description**: As a DevSecOps Lead, I want to review pending agent commands (shell scripts, file writes) and approve/reject them with a swipe, so that malicious or erroneous agent runs are blocked.
* **Dependencies**: SEC-1, Drift DB Setup.
* **Acceptance Criteria**:
  1. Displays queue of pending actions showing command hash, code diffs, and risk rating.
  2. Approving triggers Secure Enclave ECDSA signature generation over the command payload.
  3. Signed payload is posted back to the workstation host to release the agent block.
* **Definition of Done**:
  * Signature verification integration test passes using host public key registry.
  * Rejection flows allow typing feedback text back to agent reasoning loops.

#### Story HITL-2: Actionable Push Approvals (P1)
* **Description**: As an operator, I want to receive a push notification when an agent requires approval and approve it directly from my device lock screen, so that workflows are not stalled.
* **Dependencies**: HITL-1.
* **Acceptance Criteria**:
  1. Workstation host pushes FCM/APNs notification with E2EE payload containing approval details.
  2. Device decrypts payload locally and displays custom notification UI.
  3. Lock-screen actions ("Approve", "Reject") prompt for biometric validation before executing mTLS POST.
* **Definition of Done**:
  * E2EE decryption verified using device public keys.
  * Notification actions correctly update the local Drift DB queue.

---

## 3. General Definition of Done (DoD)
All stories within the backlog must satisfy the following checklist before being marked **Complete**:
- [ ] **Static Analysis**: Zero lints or warnings under Dart/Next.js strict rule configurations.
- [ ] **Unit Tests**: Coverage greater than **80%** (100% on security modules).
- [ ] **Widget/Golden Tests**: Verification of all UI states (Loading, Success, Empty, Error).
- [ ] **Documentation**: API specifications updated, code symbols documented, guides written.
- [ ] **Architecture Check**: Verified that Clean Architecture layers are respected without circular dependencies.
- [ ] **Peer Review**: Approved by at least one Domain Lead.
