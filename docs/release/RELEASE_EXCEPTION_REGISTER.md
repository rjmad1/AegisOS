# Release Exception Register (RER)

The Release Exception Register governs operational release exceptions. While the Constitutional Exception Register (CER) governs architectural deviations, the RER tracks non-blocking operational, security, and deployment issues that are accepted for a release candidate.

Every non-blocking issue must be captured here to ensure release decisions remain transparent and auditable.

---

## Active Exceptions

| Field | Details |
|---|---|
| **Identifier** | RER-001 |
| **Severity** | Low / Moderate |
| **Component** | `monaco-editor` / `next` UI dependencies |
| **Description** | 9 moderate/low vulnerabilities flagged by `npm audit` (e.g., `dompurify` in `monaco-editor`, `postcss` in `next`). |
| **Impact** | Minimal. These are client-side or build-time dependencies that do not expose the core runtime or data plane to remote exploitation in our deployment topology. |
| **Mitigation** | Strict Content Security Policy (CSP) headers applied via API Gateway. Input validation enforced at the GraphQL/REST edge before reaching the UI components. |
| **Planned Resolution** | v1.3.1 (Awaiting upstream patches to stabilize in the next framework minor releases) |
| **Owner** | Platform Operations (Frontend Security Pod) |
| **Status** | **Accepted** (Approved for v1.3.0-rc1) |
