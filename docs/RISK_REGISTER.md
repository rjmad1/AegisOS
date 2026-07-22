# AegisOS Risk Register
**Program Risk Assessment, Mitigations & Ownership Matrix**

This risk register identifies major risks facing the AegisOS implementation program and provides actionable mitigation strategies to manage project risk.

---

## 1. Risk Matrix Overview
Risks are evaluated using a qualitative analysis matrix combining **Impact (Low/Medium/High)** and **Likelihood (Low/Medium/High)** to prioritize operational responses.

---

## 2. Risk Ledger

| Risk ID | Category | Description / Scenario | Impact | Likelihood | Mitigation Strategy | Owner |
|---|---|---|---|---|---|---|
| **RSK-SEC-01** | Security | **Secure Enclave Access Constraints**: Development emulators lack hardware enclaves, causing biometric or key-gen code crashes during simulation. | High | Medium | Implement a soft fallback keystore (software-based keychain) gated by `kDebugMode` flags. Restrict hardware-only storage to Release profile builds. | DevSecOps Lead |
| **RSK-SEC-02** | Security | **Client Cert Leakage**: Client certificates stored on root-compromised (jailbroken) devices are extracted, exposing the mTLS gateway. | High | Low | Enforce strict application attestation checks (Play Integrity / DeviceCheck). Bind the certificate with biometric challenge keys, purging session keys on tampering. | DevSecOps Lead |
| **RSK-NET-01** | Technical | **Tailscale Network Drops**: Live VPN connection drops under unstable cellular coverage (tunnel jitter), resulting in broken WebSocket/SSE sockets. | Medium | High | Construct an automated exponential backoff reconnect engine. Queue offline approval cards and sync actions in Drift DB, executing them upon tunnel restore. | Principal Mobile Architect |
| **RSK-DAT-01** | Technical | **Database Sync Conflicts**: Concurrent writes to local SQLite (Drift) and remote PostgreSQL conflict during delta sync calculations. | High | Medium | Implement Last-Write-Wins (LWW) conflict policies anchored to atomic workstation host master time. Log conflicts for admin review when structural merges fail. | Chief Architect |
| **RSK-PERF-01** | Performance | **SSE UI Freeze**: Rendering high-volume SSE chat streams (large context summaries, code highlight trees) blocks the Flutter UI main thread, causing lag. | Medium | Medium | Offload JSON parsing and markdown parsing to separate Dart isolates. Keep the main isolate focused on rendering pre-built text spans. | Principal Mobile Architect |
| **RSK-PERF-02** | Performance | **VRAM Resource Starvation**: Loading multiple concurrent models on the workstation GPU exceeds hardware memory limit, crashing the Ollama daemon. | High | Medium | Implement a model queue broker in Caddy/Next.js Console. Set model eviction timers (unload inactive models) and enforce maximum context size restrictions. | AI Systems Architect |
| **RSK-UX-01** | UX | **Notification Delay**: FCM/APNs push notification delivery delays cause operators to miss critical HITL approvals, stalling automated pipelines. | Medium | High | Maintain fallback polling queries in the mobile application when active. Notify the operator via local system alarms if a critical block exceeds 5 minutes. | Product Director |
| **RSK-OPS-01** | Operational | **Disaster Recovery Loss**: Workstation database corruption occurs and backup recovery fails due to SQLite/PostgreSQL schema misalignment. | High | Low | Schedule automated monthly recovery dry-runs. Run Prisma schema validation checks on database mount to guarantee table parity. | SRE Lead |
| **RSK-OSS-01** | Open Source | **Upstream Dependency Drift**: Critical updates in Ollama or LiteLLM introduce breaking changes to APIs, breaking Next.js API integrations. | Medium | Medium | Pin all local and containerized dependencies using exact docker image hashes. Run overnight integration test suites against new candidate releases. | Release Train Engineer |
| **RSK-OPS-02** | Operational | **Production Deployment Variability**: Lack of automated prerequisite checks leads to failed deployments in varied customer environments (Kubernetes/Docker). | High | Medium | Implement `aegis verify-infra` CLI command for pre-flight validation. Enforce Zod schema validation on `aegis.config.yaml` at startup. | Principal SRE |
| **RSK-SEC-03** | Security | **Untrusted Marketplace Extensions**: Execution of uncertified Provider/Mission Packs compromises the Platform Intelligence Kernel (PIK). | High | Medium | Implement strict sandbox execution for uncertified extensions. Mandate cryptographic signing for all first-party and official ecosystem packages. | Security Architect |
| **RSK-OPS-03** | Operational | **Telemetry Blindspots**: Placeholder SLOs/Error Budgets fail to alert operators during active degradation of API or workflow latency. | High | High | Wire `ReliabilityEngineeringFramework` to concrete OTel sinks. Tie Error Budget exhaustion to deployment pipelines to halt regressions. | Principal SRE |
---

## 3. Risk Tracking & Review Lifecycle
The Risk Register is reviewed bi-weekly during program syncs led by the Program Manager. If any risk trigger occurs, the mitigation strategy is immediately initiated by the designated Owner.
