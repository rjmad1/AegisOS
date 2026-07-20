# AegisOS Engineering Mission — Developer & Extension Guide

| Metadata | Value |
|---|---|
| **Document ID** | EMO-DEV-2026 |
| **Status** | Active |
| **Authority** | Platform Architecture Lead |

This document guides core engineering developers and plugin developers on extending and interacting with the Engineering Mission Orchestrator (EMO).

---

## 1. Architectural Overview

EMO coordinates all self-engineering activities through a 13-stage state machine. Rather than introducing duplicate execution engines, EMO composes lower-level pipelines:

```
[ Ingress Ingestion (PKIP) ] ──> [ Change Impact (CPIP) ] ──> [ Planning Engine ]
                                                                     │
[ AKMS Memory Ingestion ] <─── [ Governance Audit (AGTDP) ] <─── [ Execution ]
```

---

## 2. Canonical Domain Models

All operations run on the canonical `EngineeringMission` model:

```typescript
import { EngineeringMission } from '@/platform/mission/types';
```

Key fields include:
- `id`: Unique mission identifier.
- `objective`: Objective string (e.g. "Refactor auth models").
- `lifecycleState`: The active transition state (`REQUESTED` ──> `CLOSED`).
- `evidence`: Cryptographic record ledger of transition hashes.
- `impactGraph`: Downstream and upstream entities resolved by CPIP.

---

## 3. Dynamic Plugin Extensibility

Plugin developers can contribute custom capabilities without modifying EMO core code.

### A. Implementing custom policies
```typescript
import { IMissionPolicy } from '@/platform/mission/registry';

export class CustomSecurityPolicy implements IMissionPolicy {
  public get policyId() { return 'custom-firewall-check'; }

  public async evaluate(mission: any) {
    // evaluate custom policies
    const isAllowed = !mission.objective.includes('bypass');
    return { allowed: isAllowed, reason: isAllowed ? undefined : 'Bypass keyword not allowed' };
  }
}
```

### B. Registering a Plugin
```typescript
import { missionRegistry } from '@/platform/mission/registry';

missionRegistry.registerPlugin({
  pluginId: 'enterprise-security-pack',
  missionTypes: ['secure-migration'],
  policies: [new CustomSecurityPolicy()],
});
```
