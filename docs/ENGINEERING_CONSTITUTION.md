# AegisOS Engineering Constitution

This document is the supreme engineering authority governing all future development.

Every implementation, pull request, feature, workflow, agent, API, prompt, database change, mobile feature, infrastructure modification, and architectural evolution shall comply with this constitution.

Architecture is considered stable.

The objective is no longer to invent architecture.

The objective is disciplined implementation.

---

## PART I: Engineering Principles

- **Reuse before Extend.**
- **Extend before Create.**
- **Refactor before Rewrite.**
- **Delete before Duplicate.**
- **Configuration before Code.**
- **Contracts before Implementations.**
- **Composition before Inheritance.**
- **Automation before Manual Processes.**
- **Observability before Optimization.**
- **Security before Exposure.**
- **Correctness before Performance.**
- **Maintainability before Cleverness.**

---

## PART II: Architectural Rules

- **No duplicate runtimes.**
- **No duplicate event buses.**
- **No duplicate workflow engines.**
- **No duplicate prompt systems.**
- **No duplicate registries.**
- **No duplicate knowledge stores.**
- **No duplicate configuration systems.**
- **No duplicate execution payloads.**
- **No duplicate authentication systems.**
- Every capability must reuse existing platform services.

---

## PART III: Implementation Rules

Every implementation shall begin by identifying:
- Existing code
- Existing services
- Existing APIs
- Existing workflows
- Existing prompts
- Existing models
- Existing registries
- Existing documentation
- Existing tests

If reuse is possible:
**DO NOT CREATE NEW CODE.**

---

## PART IV: Documentation Rules

- No feature may exist without documentation.
- No documentation may exist without implementation references.
- Every ADR must reference implementation.
- Every implementation must reference ADR.

---

## PART V: Testing Rules

- No implementation without tests.
- No feature without integration tests.
- No API without contract tests.
- No workflow without execution tests.
- No agent without evaluation.
- No model without benchmarks.

---

## PART VI: Quality Gates

Every Pull Request must satisfy:
- Compilation
- Lint
- Formatting
- Unit Tests
- Integration Tests
- Performance
- Security
- Documentation
- Architecture

---

## PART VII: Architecture Gates

Before implementation, answer:
1. Does it already exist?
2. Can it be reused?
3. Can it be extended?
4. Does it duplicate anything?
5. Does it violate the Capability Layer?
6. Does it violate the Intent Layer?
7. Does it violate the Universal Execution Contract?
8. Does it violate Runtime Semantics?

If **YES** to duplication or violations (or **YES** to "does it already exist?"), **Stop implementation.**

---

## PART VIII: Evolution Rules

Every release shall:
- Reduce technical debt.
- Increase reuse.
- Improve observability.
- Improve security.
- Improve maintainability.

---

## PART IX: Definition of Excellence

A feature is complete only when:
- Implemented
- Documented
- Tested
- Observable
- Recoverable
- Secure
- Governed
- Extensible
- Backward Compatible

---

This constitution supersedes all future implementation decisions unless formally amended through an Architecture Decision Record.
