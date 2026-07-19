# 02. Information Architecture

## Global Navigation Hierarchy
The global navigation is flattened into a single Platform group to minimize depth.
1. **Dashboard**: Executive operations center.
2. **Participants**: UAF agent management.
3. **Capabilities**: Tooling and UEP registry.
4. **Operations**: Infrastructure and jobs.
5. **Knowledge**: Graph and storage.
6. **Platform Intelligence**: PAOS and autonomous governance.
7. **Observability**: Live telemetry and traces.
8. **Governance**: Constitutional engine and budgets.
9. **Benchmarking**: Subsystem Benchmark Packs (SBP).
10. **Certification**: ERWC and release manifests.
11. **Qualification**: PQF edge/cloud readiness.
12. **Architecture Explorer**: Digital Twin topological canvas.

## Search Model & Command Palette
The primary method of arbitrary navigation is the **Universal Search Shell** (Command Palette).
- Local filtering is deprecated in favor of a global SearchEngine integration.
- Keyboard shortcut Ctrl+K invokes the Command Palette from anywhere, offering Quick Access, Favorites, and Recent Items alongside entity searches.

## Breadcrumb Strategy & Persistent Context
Breadcrumbs (Console > Observability > trc-982) provide horizontal context. The top bar permanently surfaces the active ExecutionContext (Tenant, Project, Mode), ensuring operators never lose situational awareness.
