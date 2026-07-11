# ADR-008: Platform Asset Catalog Design

## Status
Approved

## Context
A major blocker for long-term ownership and team collaboration is the lack of a centralized, readable index describing the components, models, configurations, APIs, and scripts that make up the AI Workstation platform. Developers and administrators rely on tribal knowledge.

## Decision
Introduce a discoverable and machine-readable platform catalog under `automation/catalogs/`. The catalog consists of separate JSON files that index:
- `components.json`: System software requirements (Git, Node, Docker).
- `services.json`: NSSM and SCM service specifications.
- `agents.json`: Configured agents.
- `prompts.json`: Reusable prompt templates.
- `models.json`: Available local models (Gemma, Qwen, DeepSeek).
- `configurations.json`: Config formats and purposes.
- `scripts.json`: Command-line script maps.
- `apis.json`: REST API contracts.
- `plugins.json`: Platform extensions (adapters, providers).
- `databases.json`: SQLite, PostgreSQL, MongoDB mappings.
- `knowledge.json`: Context RAG sources.

## Alternatives Considered
- **Central spreadsheet catalog**: Hard to sync with git and version control.
- **Dynamic auto-generated catalog**: High execution cost. A static JSON manifest catalog is easy to parse, update, and search.

## Trade-offs
- *Pros*: Clear visual mappings; machine-readable for automation; self-documenting code.
- *Cons*: Needs manual updates if model aliases or scripts are added/removed.

## Consequences
- The console dashboard or deployment scripts can dynamically scan and print platform assets.
- Third parties can quickly review what components are active.
