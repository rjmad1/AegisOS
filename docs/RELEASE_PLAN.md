# AegisOS Release Plan
**General Availability (GA) Release Train & Versioning Pipeline**

This document establishes the release governance model, versioning semantics, and the release train schedule from the greenfield baseline to Version 1.0 GA.

---

## 1. Versioning Strategy
AegisOS adheres strictly to Semantic Versioning 2.0.0 (SemVer) with enterprise extensions:
* **v0.1.0 – v0.5.0 (Alpha)**: Feature-specific developmental increments focusing on core infrastructure, sync engines, and primary UI views.
* **v0.9.0 (Beta)**: Feature-complete release. Focus is shifted entirely to security audits, performance profiling, backup validation, and bug stabilization.
* **v1.0.0 (GA)**: The authoritative production release. Validated against all reliability, security, and performance standards.

---

## 2. Program Increment & Sprint Cadence
The release train runs on 2-week sprints, grouped into 6 Program Increments (PIs):

```
[Sprint 0] -> Baseline Set & Bootstrap Complete (Current State)
   │
[PI 1: Security & Identity] -> Sprints 1-2 (v0.1)
   │   ├── Tailscale VPN overlay integration
   │   └── mTLS and Secure Enclave key enrollment
   │
[PI 2: Sync & Storage] -> Sprints 3-4 (v0.2)
   │   ├── Drift DB with SQLCipher (AES-256)
   │   └── Delta Sync Engine implementation
   │
[PI 3: Monitoring & Command] -> Sprints 5-6 (v0.3)
   │   ├── 5Hz WebSocket telemetry gauges
   │   └── Docker service control console
   │
[PI 4: Conversational AI] -> Sprints 7-8 (v0.4)
   │   ├── SSE token streaming chat interface
   │   └── VRAM model manager
   │
[PI 5: HITL Approvals] -> Sprints 9-10 (v0.5)
   │   ├── ECDSA signed approvals queue
   │   └── E2EE push notifications
   │
[PI 6: Hardening & Compliance] -> Sprints 11-12 (v0.9 -> v1.0 GA)
       └── Soak testing, SOC2 checklist audit, Disaster Recovery validation
```

---

## 3. Release Matrix & Version Gates

| Release Version | Scope Target | Quality Gate / Gating Criteria |
|---|---|---|
| **v0.1.0** (Sprint 2) | Secure mTLS Tunnel | • 100% test coverage on cryptographic signature classes.<br/>• Zero port exposure outside Tailscale overlay. |
| **v0.2.0** (Sprint 4) | Offline Sync & DB | • Drift database schema is mounted and verified as encrypted.<br/>• Offline actions queue processes delta syncing upon reconnect. |
| **v0.3.0** (Sprint 6) | Telemetry dashboard | • Telemetry renders at 60fps with zero rendering delays on mobile.<br/>• Reconnection happens in < 1.5 seconds. |
| **v0.4.0** (Sprint 8) | SSE Chat Streaming | • SSE chat token stream handles 30+ tokens/sec without freezing UI.<br/>• Markdown and code blocks render correctly. |
| **v0.5.0** (Sprint 10) | HITL Approval Queue | • ECDSA signature generation in Secure Enclave is validated.<br/>• E2EE push notifications display correctly on iOS/Android. |
| **v0.9.0** (Sprint 11) | Feature Freeze (Beta) | • 80% coverage on all feature modules.<br/>• Load testing verifies 24-hour continuous socket stream stability. |
| **v1.0.0 GA** (Sprint 12) | General Availability | • 100% compliance on the GA Checklist.<br/>• Complete SOC2/ISO 27001 readiness review signs off. |

---

## 4. Release Process & Pipeline Automation
Releases are packaged automatically through the CI/CD pipeline:
1. **Developer Branch (`feature/*`)**: Code is developed and tested. Lints must be 100% clean.
2. **Integration (`develop`)**: Code from feature branches is merged via PRs. Triggers automated unit, widget, and golden tests.
3. **Release Candidates (`release/vX.Y.Z`)**: Created at the end of each Program Increment. Triggers automated compilation of Android App Bundles (AAB) and iOS IPAs.
4. **Production (`main`)**: Tags release versions. Triggers deploy scripts to public/private registries.
