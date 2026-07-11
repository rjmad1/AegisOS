# ADR-005: Repository Information Architecture and Rationalization

## Status
Approved

## Context
Over time, the repository accumulated loose documentation, redundant backup scripts, separate disaster recovery runners, and configuration guides directly at the root and under scattered folders (`Deployment/`, `DisasterRecovery/`, `As Is State Documentation_July 09 2026/`). This organically grown structure makes the project hard to navigate, maintain, and package for third parties.

## Decision
Rationalize and group all files into clean, decoupled architectural domains:
1. `adr/`: Holds formal Architectural Decision Records (ADRs).
2. `docs/`: Holds consolidated manuals, guides, reports, license information, and release definitions.
3. `automation/`: Contains re-engineered, standardized PowerShell automation scripts, configurations, catalogs, and helper modules.
4. Move and unify the scripts from `Deployment/` and `DisasterRecovery/` to `automation/`. Remove redundancy by merging the 9 disaster recovery script modules into the master `automation/Restore.ps1` and `automation/Validate.ps1` processes.
5. Create a root-level `Bootstrap.ps1` script to simplify third-party onboarding.

## Alternatives Considered
- **Maintain current folder layout**: Rejected due to duplication and clutter.
- **Convert everything to an npm package structure**: Rejected since deployment scripts are PowerShell-based for native Windows SCM/NSSM wrappers.

## Trade-offs
- *Pros*: Clear, self-documenting directory structure; simplifies packaging; reduces codebase size.
- *Cons*: Moves script files, requiring updating manual and automated paths.

## Consequences
- Navigating the repository requires zero tribal knowledge.
- Scripts are located in a single domain (`automation/`).
- Distributable zip packages can be generated cleanly by excluding directories outside the platform core.
