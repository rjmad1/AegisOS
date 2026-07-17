# AegisOS Baseline Freeze Package

| Freeze Version | v1.0.0-freeze |
|---|---|
| **Freeze Date** | 2026-07-17 |
| **Scope** | Core Architecture, Configurations, Registries, Dependencies, and Digital Twin |
| **Status** | **LOCKED & FROZEN** |

All future modifications, refactorings, or enhancements to AegisOS must be audited against this frozen reference baseline. Any deviation in these signatures will invalidate the certification status.

---

## 1. Reference Checksums (SHA-256)

These SHA-256 checksums lock down the core specifications, configurations, schemas, and architecture files:

| File Name | Location | SHA-256 Checksum |
|---|---|---|
| **ARCHITECTURE.md** | [ARCHITECTURE.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/ARCHITECTURE.md) | `56193B0AD4B2261316317669A05194C54E6CB8809BEF1C90370E7FE587219283` |
| **ports.json** | [ports.json](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/configs/ports.json) | `69C4DD84DA24958D17E15F8DD73D8DB8256B3F3532372CBBB35797BE2EC9E456` |
| **schema.prisma** | [schema.prisma](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/prisma/schema.prisma) | `566B1B8B7F88AA4D0065547C1E13C4E97A191716BD6DB445E09697D4C232248B` |
| **package.json** | [package.json](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/package.json) | `7F376C7C57A3457CC4E61AAFF5E81E613F6CBF823F7E7E24F80E9F315F743466` |
| **ADR-009** | [ADR-009-Autonomic-Operating-System-Architecture.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-009-Autonomic-Operating-System-Architecture.md) | `8FF748CEF256375A8C75C84BB7C647509FE4539296CFE7F11C0D50F5A7BF1E58` |
| **ADR-010** | [ADR-010-Executive-Control-Plane.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-010-Executive-Control-Plane.md) | `A74F5F69CB78A0C5478C24DCB593CBB4A6F753C68DF403AB2BB96AD74DBBB596` |
| **ADR-011** | [ADR-011-Event-Driven-System-Decoupling.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-011-Event-Driven-System-Decoupling.md) | `89A3CCD7B238A514FE58AA5E8A89574C4806157FCA31AF77A9BC9CE373A499B0` |
| **ADR-012** | [ADR-012-Cognitive-Observability-And-Continuous-Evaluation.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-012-Cognitive-Observability-And-Continuous-Evaluation.md) | `276972EC6516847D97FBA47CAB006C12A8EA60453BFDA30B5375478FC8F081B5` |
| **MASTER_DELIVERABLES.md** | [MASTER_DELIVERABLES.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/autonomic_transformation/MASTER_DELIVERABLES.md) | `713722A5690DFFC0ACFDE302B457D1767FFD57A941D9ADF2D3FBCD14A1243618` |

---

## 2. Directory Structure locking (Recursive Directory Hashes)

The reference workspace structure has been cataloged. To verify structural locking, run:
```powershell
Get-ChildItem -Path adr, configs, docs, src -Recurse -File | Get-FileHash -Algorithm SHA256
```
Comparing runtime file sets against this registry ensures zero unapproved scripts, configurations, or schemas are injected during the Phase 3 implementation cycles.
