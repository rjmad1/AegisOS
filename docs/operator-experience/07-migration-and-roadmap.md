# 07. Implementation Roadmap & Migration Strategy

## Design System Alignment & Gap Analysis
The current UI has recently undergone a major structural refactor (OXA Sprint 1-5).
- **Current State**: The global navigation is flattened into 18 capability-aligned modules. The Command Palette has superseded local search.
- **Technical Debt**: Legacy components from the previous 'application screens' era still exist in isolated component directories. 
- **Migration Requirements**: All legacy components must be audited against this OXA blueprint and either refactored or deleted.

## Implementation Roadmap

### Phase 1: Structural Alignment (Completed)
- Directory structures and oot.ts mapping to the 18 new domains.
- Implementation of the Universal Search Shell.

### Phase 2: Component Refactoring (In Progress)
- Audit existing src/components/* against the OXA Component Guidelines.
- Eliminate duplicate tables, buttons, and form layouts.
- Implement strict loading and error boundaries across all domains.

### Phase 3: Visualization Rollout (Upcoming)
- Implement D3/React Flow canvas for the Architecture Explorer.
- Connect live WebSocket streams to the Observability telemetry components.
- Integrate the Qualification PQF and Certification ERWC widgets to the backend orchestrators.

### Phase 4: Role-Based Hardening (Upcoming)
- Connect the ctiveRoles mock logic in NavigationService to the actual IExecutionContext and auth providers.
- Implement UI-level blocking for human-in-the-loop (HITL) Policy Service events.

## Rollback Strategy
The frontend architecture operates ephemerally. Any breaking changes to the UX can be rolled back via standard git reversion without impacting backend platform state, provided no backend APIs were altered synchronously.
