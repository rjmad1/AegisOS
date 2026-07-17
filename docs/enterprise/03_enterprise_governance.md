# Enterprise Governance Framework

| Field | Value |
|---|---|
| **Document ID** | EGF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Enterprise Standard |
| **Owner** | Enterprise Architect (TOGAF) / Enterprise Documentation Architect |

---

## 1. Architectural Decision Record (ADR) Registry

Architectural decisions are managed using structured ADRs. The registry tracks the history and status of all key design choices.

### 1.1 Decision Register

| ADR ID | Title | Status | Date | Core Decision |
|---|---|---|---|---|
| **[ADR-001](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-001-Contract-First-Versioned-API-Boundaries.md)** | Contract-First Versioned API | Approved | 2026-07-10 | Force all external client interfaces through explicit, versioned, contract-first API routes (`/api/v1/`). |
| **[ADR-002](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-002-Server-Side-Decoupled-Authentication.md)** | Server-Side Decoupled Auth | Approved | 2026-07-10 | Isolate token signing, validation, and session tracking on the server backend using secure HttpOnly cookies. |
| **[ADR-003](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-003-Unified-Event-Driven-Registry.md)** | Unified Event-Driven Registry | Approved | 2026-07-11 | Standardize browser component updates on a decoupled, client-side EventBus aligned with backend event flows. |
| **[ADR-004](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-004-Pipeline-Worker-Processing-Architecture.md)** | Pipeline Worker Processing | Approved | 2026-07-11 | Process long-running executions using background jobs serialized via Saga database checkpoints. |
| **[ADR-005](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-005-Repository-Information-Architecture-Rationalization.md)** | Information Architecture | Approved | 2026-07-11 | Restructure documentation folders to maintain strict separation of guides, standards, and reports. |
| **[ADR-006](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-006-Script-Engineering-Standards.md)** | Script Engineering Standards | Approved | 2026-07-12 | Mandate strict typing, error trapping, and verbose outputs for all platform PowerShell automation scripts. |
| **[ADR-007](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-007-Portable-Configuration-Architecture.md)** | Portable Configuration | Approved | 2026-07-12 | Store system variables in database-backed Config models with automated schema version history tracks. |
| **[ADR-008](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/adr/ADR-008-Platform-Asset-Catalog-Design.md)** | Platform Asset Catalog | Approved | 2026-07-12 | Consolidate and model workstation providers, models, actions, workflows, and tools into static schemas. |

### 1.2 ADR Lifecycle
Decisions follow a strict state transition:
`Proposed â†’ Under Review â†’ Approved | Rejected â†’ Deprecated | Superseded`.
Any modification to system architecture requires the creation of a new ADR file in the `adr/` directory.

---

## 2. Technology & Coding Standards

### 2.1 Technology Stack Standards
The primary runtime technologies are standardized to ensure supportability, maintenance, and compliance:
* **Frontend/Backend Engine**: Next.js (App Router, React 19, Node.js v20+).
* **Database Access**: Prisma ORM client v6+ with SQLite database engine (development and single-instance local perimeters).
* **Styling**: Tailwind CSS v4+ with custom Vanilla CSS utilities.
* **Authentication**: OAuth 2.0 (OIDC) via `oauth4webapi` and JWT encryption via `jose`.

### 2.2 TypeScript Coding Standards
* **Strict Type Safety**: `tsconfig.json` must enforce `"strict": true`. The use of `any` is prohibited. Use `unknown` with type guards if types are unpredictable.
* **Functional Component Structure**: React functional components must use typed props:
  ```typescript
  interface DashboardWidgetProps {
    widgetId: string;
    refreshIntervalMs?: number;
  }
  export const DashboardWidget: React.FC<DashboardWidgetProps> = ({ widgetId, refreshIntervalMs = 5000 }) => { ... }
  ```
* **Asynchronous Guarantees**: All asynchronous operations must include try/catch structures and log errors structured with unique correlation IDs.

### 2.3 Naming Standards
* **Files**:
  * React Components: PascalCase (e.g., `EventInspector.tsx`).
  * Repositories/Services: camelCase with dot notation (e.g., `user.repository.ts`, `auth.service.ts`).
  * Configuration: snake_case or kebab-case (e.g., `event_dlq.json`, `next.config.ts`).
* **API Endpoints**: Plural nouns and lowercase letters (e.g., `/api/v1/admin/users`, `/api/v1/workflows/executions`).
* **Environment Variables**: UPPERCASE with `OPS_` prefix for system settings, and `NEXT_PUBLIC_` for variables exposed to the browser.

---

## 3. Repository & Git Standards

### 3.1 Branching Strategy (Trunk-Based)
* **Default Branch**: `main`. Direct pushes to `main` are disabled via branch protection.
* **Feature Branches**: Branch from `main` using standard prefixes:
  * `feature/<issue-id>-<description>`
  * `bugfix/<issue-id>-<description>`
  * `hotfix/<issue-id>-<description>`
* **Lifecycle**: Feature branches should live less than 48 hours. Rebasing (`git rebase main`) is required before merging.

### 3.2 Commit Standards (Conventional Commits)
Commits must use the format: `<type>(<scope>): <subject>`.
* **Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
* **Signature**: Commits must be cryptographically signed with GPG or SSH keys. Unsigned commits will fail pre-receive hooks.

### 3.3 Merge Strategy
* **Feature Branches to Main**: Squash and Merge is enforced. This maintains a clean, linear history on `main` to ease rollbacks.
* **Releases**: Rebase and Merge.

---

## 4. Documentation Standards

### 4.1 Document Metadata Header
Every Markdown document must begin with a standardized metadata block:
```markdown
# [Title]

| Field | Value |
|---|---|
| **Document ID** | [DOC-XXX-000] |
| **Version** | [X.Y.Z] |
| **Date** | [YYYY-MM-DD] |
| **Classification** | [Public | Internal] |
| **Owner** | [Role Title] |
| **Review Date** | [YYYY-MM-DD] |
```

### 4.2 Cross-Linking and Self-Containment
* Use relative file URLs for cross-references: `[link text](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/...)`.
* Do not rely on external web links for core system definitions.

---

## 5. Lifecycle Policies

### 5.1 Semantic Versioning Policy
Releases follow **SemVer 2.0.0**:
* **Major (X.0.0)**: Breaking API changes or core architecture refactors.
* **Minor (0.Y.0)**: New features or modules added in a backward-compatible manner.
* **Patch (0.0.Z)**: Bug fixes, performance improvements, or documentation updates.

### 5.2 API Versioning Policy
* API routes must include the major version path: `/api/v1/`.
* Breaking API shifts require exposing a new route path (e.g., `/api/v2/`) while supporting `/api/v1/` for at least one minor release cycle.

### 5.3 Deprecation Policy
* **Announcement**: Code or APIs slated for removal must be marked as `@deprecated` in the code, and return a `X-Deprecation-Warning` header in API responses.
* **Grace Period**: Standard APIs require a minimum 90-day grace period between deprecation announcement and removal.

### 5.4 Support Lifecycle
* **LTS Releases**: Supported for 18 months from release date (security patches and critical bug fixes).
* **Current Releases**: Supported until the next minor or major version release.

---

## 6. Change Management Policy

### 6.1 Change Categories
1. **Standard Changes**: Low risk, pre-approved (e.g., documentation fixes, style updates).
2. **Normal Changes**: Requires peer review, CI/CD green gates, and a release schedule (e.g., new features, database migrations).
3. **Emergency Changes**: Production fixes bypassing standard release schedules. Requires CPO and Security Architect sign-off.

### 6.2 Rollback Policy
If post-deployment smoke tests fail, or an SLO error budget is breached:
1. **Automated Rollback**: The deployment system automatically rolls back to the previous stable container image hash.
2. **Incident Postmortem**: Triggered within 24 hours of rollback.

