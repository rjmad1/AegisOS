# Constitutional Exception Register (CER)

This register acts as the authoritative log of approved architectural and engineering exceptions to the [AegisOS Engineering Constitution](../ENGINEERING_CONSTITUTION.md).

---

## Governance Process

Legitimate engineering needs may occasionally conflict with constitutional policies. Rather than weakening the core principles or bypassing validation, teams must obtain approval for a formal Exception.

1. **Submission**: Propose a new exception by creating a Pull Request that adds a new entry to the **Active Exceptions** list below.
2. **Review**: The architecture team and relevant Domain Leads will review the proposal based on justification, safety mitigations, and scope.
3. **Approval**: If approved, the exception is merged with a status of `APPROVED` and assigned an expiration date.
4. **Enforcement**: The static scanners, qualification pipelines, and release gates read this register to validate exceptions. Any non-compliant code *without* a corresponding active exception will fail the build.

---

## Exception Template

To request an exception, copy the block below and append it to the **Active Exceptions** section:

```markdown
### CER-###: [Short Title]

- **Status**: [PENDING / APPROVED / EXPIRED / DEPRECATED]
- **Date Created**: YYYY-MM-DD
- **Target Expiration**: YYYY-MM-DD (Max 12 months)
- **Author**: Name <email@domain.com>
- **Referenced Article(s)**: [e.g., Article II: Architecture Freeze]
- **Linked ADR / Issue**: [ADR-###](path/to/adr.md) or [PR ####](github-link)
- **Scope**: [e.g., specific files, directories, or deployment profiles]
- **Business/Technical Justification**:
  Provide a detailed explanation of why the constitutional rule cannot be satisfied, the technical limitations, and the trade-offs of alternatives.
- **Mitigation & Risk Controls**:
  Explain what safety limits, manual audits, or automated safeguards are established to isolate the deviation.
- **Verification Plan**:
  Describe how the exception's limits will be verified during qualification runs.
- **Approving Authority**: [Pending / Name of Approving Role]
```

---

## Active Exceptions

*No active exceptions are currently registered. The AegisOS Version 1 platform is fully compliant.*

---

## Historical / Expired Exceptions

*No historical exceptions.*
