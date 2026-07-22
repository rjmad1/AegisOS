<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AegisOS Ecosystem: Guiding Principles

Think, reason, design, and respond with the following principles as default evaluation criteria:

* **Value-driven** & **Outcome-oriented**: Focus on delivering maximum value with clear outcomes.
* **User-centric** & **Business-aware**: Always prioritize user experience while maintaining awareness of business objectives.
* **Autonomous & Managed**: Autonomous where appropriate, but human-in-the-loop (HITL) when required.
* **Transparent & Explainable**: Ensure all reasoning, tool selections, and recommendations are transparent, explainable, accountable, traceable, and auditable.
* **Resilient & Available**: High availability, reliable, resilient, fault-tolerant, and gracefully recoverable.
* **Secure & Private**: Secure by default, privacy-first, following the principle of least privilege.
* **Efficient & Cost-conscious**: High performance, efficient, scalable, elastic, and cost-conscious (low TCO).
* **Maintainable & Composable**: Modular, composable, extensible, configurable, maintainable, testable, verifiable, and reusable.
* **Interoperable & Portable**: Portable, interoperable, standards-based, and API-first.
* **Local-first**: Local-first where beneficial, cloud-agnostic where practical, offline-capable when valuable.
* **Backward Compatible**: Backward compatible where feasible.
* **Simple & Intuitive**: Simple, intuitive, usable, accessible, consistent, discoverable, minimalistic, and pragmatic.
* **Data-driven**: Incremental, evidence-based, data-driven, and risk-aware.
* **Production-ready**: Future-proof where justified, production-ready, and optimized for operational excellence.

---

## Engineering & Product Principles

Explicitly optimize for:

* **KISS**: Keep It Simple, Stupid
* **YAGNI**: You Aren't Gonna Need It (No premature abstractions or feature bloat)
* **DRY**: Don't Repeat Yourself
* **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
* **Clean Code**: Separation of Concerns, Single Responsibility, Composition over Inheritance
* **Convention**: Convention over Configuration, Configuration over Code
* **Architecture**: Loose Coupling, High Cohesion, Idempotency, Determinism where possible
* **Resilience**: Fail Fast, Graceful Degradation, Progressive Enhancement, Defensive Programming, Design for Failure, Design for Scale
* **Security & Privacy**: Secure by Design, Privacy by Design
* **DevOps**: Design for Observability, Automation First, Infrastructure as Code, Documentation as Code, Version Everything

---

## Decision Framework

For every recommendation, optimize for:

1. Maximum value
2. Minimum complexity
3. Lowest operational burden
4. Lowest total cost of ownership
5. Highest maintainability
6. Highest reuse
7. Highest interoperability
8. Maximum automation
9. Production readiness
10. Long-term sustainability

---

## Critical Thinking Expectations

Always:
* Challenge assumptions.
* Surface hidden dependencies.
* Identify risks and trade-offs.
* Eliminate unnecessary complexity.
* Avoid premature optimization.
* Prefer proven solutions over novelty.
* Recommend the smallest solution that satisfies the requirement.
* Clearly distinguish facts, assumptions, constraints, and recommendations.
* Highlight technical debt and operational implications.
* Consider scalability, security, maintainability, and supportability before recommending an approach.
* Explain why an option is preferred over alternatives.

---

# AegisOS Engineering Constitution

The authoritative AegisOS Engineering Constitution has been unified and resides in [docs/ENGINEERING_CONSTITUTION.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/ENGINEERING_CONSTITUTION.md).

All contributors, including AI coding assistants, must consult and strictly adhere to the Constitution's:
- Preamble (Transition to stewardship and ecosystem pivot)
- Ten Immutable Articles of Platform Governance (Single Authoritative Runtime, Architecture Freeze, Contracts Before Implementations, etc.)
- Subordinate Bylaws (Architecture Rules, Coding Standards, Quality Gates, and Testing Rules)
- Constitutional Exception Register (CER) & Governance Compliance Matrix (GCM) frameworks

No duplicate or divergent governance definitions are permitted in this file. Please reference [docs/ENGINEERING_CONSTITUTION.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/ENGINEERING_CONSTITUTION.md) for normative architectural requirements.
