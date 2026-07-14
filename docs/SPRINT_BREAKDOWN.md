# AegisOS Sprint Breakdown
**Sprint Scope, Tasks & Resource Estimates (Sprints 1–12)**

This document details the tasks and effort estimates (in Person-Days) for each implementation sprint from the current bootstrap state to Version 1.0 General Availability.

---

## 1. Estimation Methodology
Effort is estimated across four categories for a standard cross-functional feature squad:
* **Engineering (Eng)**: Writing code, routing endpoints, database migrations, and UI components.
* **Testing (Test)**: Designing unit/widget mocks, integration setups, and manual verification runs.
* **Documentation (Doc)**: Drafting setup guides, code documentation, and README indices.
* **Release (Rel)**: Configuring deployment pipelines, package compiles, and store submissions.

---

## 2. Sprint-by-Sprint Plan

### Sprint 1: WireGuard & Tailscale Tunneling
* **Goal**: Establish a secure connection between the mobile client and the workstation host over the Tailscale VPN.
* **Key Tasks**:
  1. Build Tailscale VPN state checkers in Flutter (`platform/network`).
  2. Implement mDNS discovery mechanism for fallback proximity checks.
  3. Validate secure tunnel connection speeds and latency benchmarks.
* **Effort Estimates**:
  * **Engineering**: 12 Person-Days
  * **Testing**: 4 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 1 Person-Day

### Sprint 2: mTLS Enrollment & Enclave Keys (Release v0.1.0)
* **Goal**: Deploy the host CA certificate generation pipeline and establish mTLS authentication.
* **Key Tasks**:
  1. Establish ECDSA key pair generation inside iOS Secure Enclave / Android KeyStore.
  2. Implement client CSR submission and host-side certificate validation.
  3. Update Caddy reverse proxy rules to terminate mTLS connections.
* **Effort Estimates**:
  * **Engineering**: 15 Person-Days
  * **Testing**: 6 Person-Days
  * **Documentation**: 3 Person-Days
  * **Release**: 2 Person-Days

### Sprint 3: Drift Database & SQLCipher Encryption
* **Goal**: Mount the local relational cache using Drift ORM and secure it using hardware-derived keys.
* **Key Tasks**:
  1. Integrate SQLCipher wrapper inside the Flutter workspace.
  2. Derive database encryption key from the Secure Enclave storage.
  3. Implement base schemas for conversations, telemetry, and approvals.
* **Effort Estimates**:
  * **Engineering**: 10 Person-Days
  * **Testing**: 5 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 1 Person-Day

### Sprint 4: Delta Sync Engine & Conflict Resolution (Release v0.2.0)
* **Goal**: Develop the synchronization pipeline to replicate database state between host and mobile.
* **Key Tasks**:
  1. Construct the `/api/v2/mobile/sync` delta extraction logic on the backend.
  2. Write the client Offline Action Queue to batch-execute edits.
  3. Implement Last-Write-Wins (LWW) conflict resolution logic.
* **Effort Estimates**:
  * **Engineering**: 14 Person-Days
  * **Testing**: 6 Person-Days
  * **Documentation**: 3 Person-Days
  * **Release**: 2 Person-Days

### Sprint 5: Telemetry Socket Services & System APIs
* **Goal**: Retrieve GPU/VRAM statistics from the host system and stream them over WebSockets.
* **Key Tasks**:
  1. Replace Next.js mock endpoints with live system calls (`systeminformation` library).
  2. Set up `/ws/telemetry` socket gateway with CPU/GPU/VRAM parameters.
  3. Implement socket ping-pong connection health-checks.
* **Effort Estimates**:
  * **Engineering**: 11 Person-Days
  * **Testing**: 4 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 1 Person-Day

### Sprint 6: Monitoring Gauges & Service Controls UI (Release v0.3.0)
* **Goal**: Build the dashboard interface to display host telemetry and manage running containers.
* **Key Tasks**:
  1. Implement adaptive Gauges and service cards using M3 Slate-Indigo styles.
  2. Connect widgets to the WebSocket stream, validating 5Hz response frames.
  3. Add service restart request triggers validating mTLS roles.
* **Effort Estimates**:
  * **Engineering**: 12 Person-Days
  * **Testing**: 5 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 2 Person-Days

### Sprint 7: SSE Streaming Client & Markdown UI
* **Goal**: Connect the assistant interface to the Server-Sent Events stream for live model outputs.
* **Key Tasks**:
  1. Set up SSE stream client parser on `/sse/chat` endpoint.
  2. Integrate flutter_markdown to render code syntax highlights.
  3. Implement message bubble widgets handling streaming token updates.
* **Effort Estimates**:
  * **Engineering**: 13 Person-Days
  * **Testing**: 4 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 1 Person-Day

### Sprint 8: Model Switcher & Download Manager (Release v0.4.0)
* **Goal**: Allow downloading and hot-swapping local models from the companion app.
* **Key Tasks**:
  1. Implement Ollama model list query and hot-swap controls API.
  2. Build weight downloader component with background download bars.
  3. Connect model configuration screens to the active chat context.
* **Effort Estimates**:
  * **Engineering**: 10 Person-Days
  * **Testing**: 4 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 2 Person-Days

### Sprint 9: Approval Queue & Cryptographic Signing
* **Goal**: Establish the Human-in-the-Loop review panel for executing high-risk commands.
* **Key Tasks**:
  1. Build the approval queue dashboard cards displaying code differences.
  2. Implement Secure Enclave ECDSA signing over approved transaction hashes.
  3. Connect approvals to the local Drift database schema.
* **Effort Estimates**:
  * **Engineering**: 14 Person-Days
  * **Testing**: 6 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 1 Person-Day

### Sprint 10: E2EE Push Notification Handlers (Release v0.5.0)
* **Goal**: Dispatch encrypted approval prompts using APNs/FCM gateways.
* **Key Tasks**:
  1. Deploy FCM/APNs relay configuration on the Next.js workstation host.
  2. Encrypt push payloads using client public keys (E2EE).
  3. Write local background receivers to decrypt and mount notifications.
* **Effort Estimates**:
  * **Engineering**: 13 Person-Days
  * **Testing**: 5 Person-Days
  * **Documentation**: 2 Person-Days
  * **Release**: 2 Person-Days

### Sprint 11: Feature Hardening & Soak Tests (Release v0.9.0 Beta)
* **Goal**: Conduct performance profiling and security testing across the entire system.
* **Key Tasks**:
  1. Perform 24-hour continuous telemetry socket streaming soak tests.
  2. Run security audits (SQLCipher key extraction attempts, certificate bypasses).
  3. Execute automated golden visual testing across dynamic screen shapes.
* **Effort Estimates**:
  * **Engineering**: 8 Person-Days
  * **Testing**: 15 Person-Days
  * **Documentation**: 3 Person-Days
  * **Release**: 3 Person-Days

### Sprint 12: Compliance Audit & Deployment (Release v1.0.0 GA)
* **Goal**: Complete operational checks, verify SOC2 compliance, and publish to app marketplaces.
* **Key Tasks**:
  1. Validate all items on the General Availability Checklist.
  2. Execute backup & recovery disaster recovery dry-runs.
  3. Package and compile signed release binaries for store distribution.
* **Effort Estimates**:
  * **Engineering**: 5 Person-Days
  * **Testing**: 10 Person-Days
  * **Documentation**: 4 Person-Days
  * **Release**: 6 Person-Days
