# AegisOS Mobile Documentation Archive Manifest

* **Archived By**: Scope Reduction Directive V1.0
* **Archived Date**: 2026-07-14
* **Governing Directive**: `docs/mobile/SCOPE_REDUCTION_DIRECTIVE_V1.md`

---

## Purpose

This directory contains documentation that was archived during the MVP Scope Reduction of AegisOS Mobile. These files describe capabilities, modules, and roadmap items that are **out of scope** for the V1.0 thin-client Executive Command Center.

**These files are preserved for future reference. Do NOT delete them.**

---

## Archived Files

| File | Original Location | Reason |
|------|-------------------|--------|
| `FutureVision.md` | `docs/mobile/FutureVision.md` | On-Device SLM (Llama-1B), Cognitive Mesh, Federated RAG, Federated Learning — all violate thin-client principle |
| `Offline.md` | `docs/mobile/Offline.md` | On-device model fallback, local AI inference queue — mobile never processes AI locally |
| `Modules.md` | `docs/mobile/Modules.md` | Defined 19 modules (Knowledge, Voice, Search, Timeline & Memory, Automation & Workflows, Plugins & Marketplace, Enterprise, etc.) — replaced by 8-module scope |
| `Goals.md` | `docs/mobile/Goals.md` | Goal framework assumed broad AI platform scope with local execution |
| `JTBD.md` | `docs/mobile/JTBD.md` | Jobs-to-be-done framework assumed on-device AI, local orchestration |
| `UserStories.md` | `docs/mobile/UserStories.md` | User stories referenced local model execution, workflow design, knowledge indexing |
| `Requirements.md` | `docs/mobile/Requirements.md` | Functional requirements included out-of-scope capabilities (NL Ops, Financial Intelligence, etc.) |
| `Navigation.md` | `docs/mobile/Navigation.md` | Navigation structure assumed 19-module layout |
| `03_FEATURE_MODULES.md` | `docs/mobile/architecture/03_FEATURE_MODULES.md` | Architecture spec for 20+ feature modules including knowledge, workflows, voice, automation |

---

## V1.0 Approved Modules (8 Total)

1. Executive Dashboard
2. AI Executive Chat
3. Human Approval Center
4. Infrastructure Monitoring
5. Notifications
6. Projects
7. Upload Center
8. Settings

---

## Restoration Policy

To restore any archived feature to active scope:

1. Obtain explicit approval from the project owner
2. Move the file back to its original location
3. Update this manifest to reflect the restoration
4. Update `SCOPE_REDUCTION_DIRECTIVE_V1.md` with an amendment record
