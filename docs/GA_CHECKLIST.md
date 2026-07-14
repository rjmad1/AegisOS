# AegisOS General Availability (GA) Checklist
**Authoritative Quality Gates & Compliance Gating Criteria (V1.0 GA)**

This document establishes the criteria that must be satisfied and verified before Version 1.0 General Availability is signed off by the engineering leadership board.

---

## 1. Security & Cryptographic Gates
* [ ] **Zero-Trust Network Verification**:
  * [ ] Verify that Caddy/Nginx reverse proxy rejects direct connections lacking valid mTLS certificates.
  * [ ] Confirm no workstation backend ports (Ollama, PostgreSQL, Redis, LiteLLM) are exposed directly to the public internet or external LAN.
* [ ] **Hardware Enclave Key Parity**:
  * [ ] Verify ECDSA signature generation happens exclusively within the iOS Secure Enclave / Android KeyStore.
  * [ ] Audit that no cryptographic private keys are written to device logs or local text storage.
* [ ] **Local Storage Encryption**:
  * [ ] Extract raw SQLite database files from test devices and confirm SQLCipher encryption (returns file corruption error on direct access).
  * [ ] Enforce biometric re-authorization challenge for access to active encryption keys.

---

## 2. Performance & Resource Budgets
* [ ] **Mobile Client Rendering**:
  * [ ] Telemetry widget updates (5Hz WebSocket) operate at 60fps with zero frame rendering drops.
  * [ ] Chat interface token stream (30 tokens/sec) maintains thread execution latency under 16ms per frame.
  * [ ] Peak RAM usage of mobile companion app remains under 200MB during continuous chat session runs.
* [ ] **Workstation Performance**:
  * [ ] Next.js gateway API routing latency remains under 50ms for basic CRUD operations.
  * [ ] Host CPU/GPU usage overhead for the telemetry broker does not exceed 2% under peak stream loads.

---

## 3. Reliability & Disaster Recovery
* [ ] **Network Resilience**:
  * [ ] Client re-establishes connection and syncs state in under 1.5 seconds following cellular network dropouts.
  * [ ] Verify that background workers safely queue offline approvals in Drift DB without memory leaks.
* [ ] **Disaster Recovery**:
  * [ ] Validate automated backup script outputs a complete dump of PostgreSQL, SQLite, and MinIO object stores.
  * [ ] Execute a full restore dry-run on a fresh workstation instance, verifying 100% data recovery.

---

## 4. Functional Completeness
* [ ] **mTLS Pairing & Auth**: Device pairing QR flows, certificate enrollments, and biometric locks are functional.
* [ ] **Mission Control Dashboard**: Telemetry metrics, Docker container listings, and service control restarts operate.
* [ ] **Assistant & Models**: SSE token streams, markdown layouts, model managers, and model download controls function.
* [ ] **HITL Approvals**: signed approvals queue, rejection feedback, and E2EE push notifications function.

---

## 5. Enterprise & Compliance
* [ ] **SOC2 / ISO 27001 Audit Readiness**:
  * [ ] Ensure all access changes (device pairing, administrative actions) are recorded in the host audit tables.
  * [ ] Verify all session tokens expire within 24 hours and require fresh authentication.
* [ ] **License & SBOM Verification**:
  * [ ] Generate a complete Software Bill of Materials (SBOM) for both the Flutter app and Next.js backend.
  * [ ] Confirm all third-party libraries comply with permissive open-source licenses (MIT, Apache 2.0, BSD).
