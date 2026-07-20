# Superseded Documents Archive

> **Purpose**: This directory contains documentation files that have been superseded by canonical versions elsewhere in the repository. They are preserved here for historical traceability.
> 
> **Date Archived**: 2026-07-18
> **Reason**: Documentation Governance Rationalization

## Archived Files

| File | Superseded By | Reason |
|---|---|---|
| `CHANGELOG.md` | [`/CHANGELOG.md`](../../../CHANGELOG.md) | Merged into root changelog (both versions had unique entries) |
| `SECURITY.md` | [`/SECURITY.md`](../../../SECURITY.md) | Root version is more detailed (60 lines vs 15 lines) |
| `LICENSE.md` | [`/LICENSE`](../../../LICENSE) | Root LICENSE is the canonical distribution rights file |
| `CODEOWNERS` | [`/.github/CODEOWNERS`](../../../.github/CODEOWNERS) | GitHub convention requires CODEOWNERS in `.github/` |
| `Technical_Debt_Assessment.md` | [`/docs/TECHNICAL_DEBT.md`](../../TECHNICAL_DEBT.md) | Content merged into canonical Technical Debt Register |
| `Deployment_Guide.md` | [`/docs/DEPLOYMENT.md`](../../DEPLOYMENT.md) | Migration section merged into canonical Deployment Guide |
| `ADR-009-Command-And-Control-Subsystem.md` | [`/adr/ADR-013-Command-And-Control-Subsystem.md`](../../../adr/ADR-013-Command-And-Control-Subsystem.md) | Renumbered to ADR-013 and moved to canonical `adr/` directory (ADR-009 number was already taken) |

## Policy

- **Do not delete** these files. They serve as audit trail.
- If a superseded document is needed, restore from this archive.
- New superseded documents should be added to this directory with an entry in this manifest.
