# AegisOS Roadmap to General Availability (GA)
**Strategic Capabilities, Timelines & Major Program Milestones**

This roadmap details the high-level progression of AegisOS capabilities and establishes the key milestone dates to guide alignment across the mobile, backend, and platform teams.

---

## 1. High-Level Release Timeline

```
                     2026 Q3                                      2026 Q4
┌───────────────────────────────────────────────┐ ┌───────────────────────────────────────────┐
│     Foundation & Tunneling (Jul - Aug)        │ │      Agent & HITL Operations (Sep - Oct)   │
├───────────────────────────────────────────────┤ ├───────────────────────────────────────────┤
│ • Secure mTLS handshakes over Tailscale       │ │ • Cryptographically signed HITL Approvals │
│ • Drift DB with SQLCipher local storage       │ │ • Node-graph visual representation        │
│ • Delta Sync Engine database replication     │ │ • Model Registry and hot-swap controls    │
└───────────────────────────────────────────────┘ └───────────────────────────────────────────┘
```

---

## 2. Major Program Milestones

The following eight milestones gate progress to General Availability. Each milestone represents a major integration boundary and requires signed approval from the designated role:

```
[M1: Architecture Complete] ──► [M2: Foundation Complete] ──► [M3: Authentication Complete] ──► [M4: Infra Dashboard Complete]
            │                              │                               │                                │
            ▼                              ▼                               ▼                                ▼
[M5: Mission Control Complete] ◄── [M6: Knowledge Complete] ◄── [M7: AI Assistant Complete] ◄── [M8: General Availability Ready]
```

### Milestone 1: Architecture Complete (Target: M0)
* **Goal**: Technical designs, API contracts, domain models, and engineering playbooks are approved.
* **Owner**: Principal Mobile & Backend Architects.
* **Deliverable**: APPROVED architecture handbooks and C4 model configurations.

### Milestone 2: Foundation Complete (Target: M1 / Week 2)
* **Goal**: Greenfield bootstrap, Riverpod DI structures, Drift local storage with SQLCipher, and Tailscale WireGuard mesh tunnels are fully functional.
* **Owner**: CTO & Engineering Director.
* **Deliverable**: Running companion app on emulators establishing mTLS connection with host.

### Milestone 3: Authentication Complete (Target: M2 / Week 4)
* **Goal**: Biometric gates, OIDC/SAML enterprise integrations on the gateway, JWT session management, and Secure Enclave key enrollment are fully operational.
* **Owner**: DevSecOps Lead.
* **Deliverable**: Automated pairing QR code flows and biometric lockout verification reports.

### Milestone 4: Infrastructure Dashboard Complete (Target: M3 / Week 6)
* **Goal**: Real-time telemetry WebSocket gauges (CPU/GPU/VRAM metrics) and Docker container statuses render on the client dashboard.
* **Owner**: Principal Mobile Architect & SRE Lead.
* **Deliverable**: Telemetry streaming widget operating at 5Hz with 60fps responsiveness.

### Milestone 5: Mission Control Complete (Target: M4 / Week 8)
* **Goal**: Comprehensive cockpit dashboard allowing host selector switches, thermal alerts, active request queue visualizations, and service controller restart commands.
* **Owner**: Engineering Director.
* **Deliverable**: Service state restarts executed from the mobile dashboard.

### Milestone 6: Knowledge Complete (Target: M5 / Week 9)
* **Goal**: RAG browser indexing, knowledge base semantic searches, and document chunk references render correctly on the mobile device.
* **Owner**: AI Systems Architect.
* **Deliverable**: Search result cards linking file chunks and chunk metadata.

### Milestone 7: AI Assistant Complete (Target: M6 / Week 10)
* **Goal**: SSE streaming chat loops, markdown rendering, model downloading, and model registries hot-swapping are functional.
* **Owner**: Product Director & AI Systems Architect.
* **Deliverable**: Streaming chat page displaying model switches and token consumption meters.

### Milestone 8: General Availability Ready (Target: M7 / Week 12)
* **Goal**: All system components are locked down, SOC2 Type 1 controls are verified, disaster recovery pipelines are certified, and stability benchmark runs complete.
* **Owner**: Chief Technology Officer & SRE Lead.
* **Deliverable**: Production-certified Version 1.0 GA build released to App/Play Stores.
