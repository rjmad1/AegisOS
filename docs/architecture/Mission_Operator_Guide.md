# AegisOS Engineering Mission — Operator Guide

| Metadata | Value |
|---|---|
| **Document ID** | EMO-OPS-2026 |
| **Status** | Active |
| **Authority** | Platform Operations Lead |

This document serves as the guide for platform operators and administrators running Engineering Missions on AegisOS.

---

## 1. Overview of EMO Cockpit Controls

The Executive Engineering Cockpit aggregates all active missions. Every self-engineering action runs through the standardized 13-stage lifecycle:

```
Requested ──> Discovered ──> Analyzed ──> Impact Assessed ──> Planned ──> Simulated ──> Qualified ──> Approved ──> Executed ──> Verified ──> Documented ──> Memory Updated ──> Closed
```

---

## 2. API Operations Reference

Operators can trigger and monitor missions using standard `curl` or UI controls.

### A. Create a Mission
```bash
curl -X POST http://localhost:18789/api/v1/mission \
  -H "Content-Type: application/json" \
  -d '{
    "objective": "Refactor local cache cleaning functions in PlatformDiscoveryEngine",
    "type": "refactor",
    "priority": "MEDIUM",
    "autoStart": true
  }'
```

### B. View Mission Details and Evidence
```bash
curl http://localhost:18789/api/v1/mission/mission-abc12345
```

### C. Approve a Mission (HITL Gate)
For high-risk missions (overall risk score > 70%), the orchestrator halts at the `APPROVED` stage. An operator must submit a signature approval:
```bash
curl -X POST http://localhost:18789/api/v1/mission/mission-abc12345 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "payload": { "operatorId": "usr-admin-01", "notes": "Approved for system refactoring" }
  }'
```

---

## 3. Evidence Ledger Verification

Each stage transition records cryptographic evidence containing the stage, timestamp, and metadata payload hashed with SHA-256. This guarantees a complete audit trail for compliance and safety standards.
