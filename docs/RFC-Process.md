# AegisOS RFC (Request for Comments) Process

All changes to API contracts, the Platform Package Specification (PPS), security policies, or architectural layers must go through the formal RFC process. This guarantees backwards compatibility, security alignment, and transparent governance.

---

## 1. RFC Lifecycle

```
Draft
  │
  ▼
Proposed (Community review and testing)
  │
  ▼
Approved (Trust Authority sign-off)
  │
  ▼
Implemented (V1 codebase integration)
  │
  ▼
Active / Deprecated
```

---

## 2. Creating an RFC

1. **Copy the Template**: Create a new file in `docs/rfcs/0000-feature-name.md` using the standard layout.
2. **Assign a Pull Request**: Submit the draft as a Pull Request to the repository to begin discussion.
3. **Engage Core Maintainers**: Reviewers will check the proposal against the **AegisOS Constitution** (no duplicate runtimes, strict 7-layering).

---

## 3. RFC Template Structure

Every RFC must include:
* **Feature Name**: Short, descriptive title.
* **Start Date**: Date when draft was created.
* **Category**: (e.g., `api-gateway`, `package-spec`, `sandbox-policy`, `federation-protocol`).
* **Summary**: One-paragraph explanation.
* **Motivation**: Why are we introducing this change? What user pain point does it solve?
* **Detailed Design**: Precise specification of APIs, JSON/YAML schemas, or state machines.
* **Compatibility & Upgrade Path**: How will this affect existing V1 deployments and SDK clients?
* **Security & Privacy Implications**: Threat modeling, sandboxing impact, and data sovereignty considerations.
* **Alternative Approaches**: Other designs considered and reasons for rejection.
