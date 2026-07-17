# ADR-012: Cognitive Observability & Continuous Evaluation

## Status
Approved

## Context
Standard infrastructure monitoring (tracking CPU, RAM, disk usage, and network traffic) does not capture the health of AI reasoning workflows. A model can return syntax errors, hallucinate completely, or exceed context budgets while host containers report 100% network and process health.

## Decision
We implement **Cognitive Observability** and **Continuous Evaluation** as part of the Control Plane (Layer 5). 
For every execution, the platform:
1. Observes cognitive metrics: Reasoning latency, Grounding scores, Tool utilization efficiency, and Context budgets.
2. Performs automated evaluation: Evaluates correctness, completeness, grounding correctness, security violations, and compliance bounds.
3. Formulates a structured JSON scorecard committed directly to PostgreSQL.

This data is used to optimize model selection routing, detect performance drift, and trigger automated self-healing.

## Alternatives Considered
* **Ad-hoc Logging**: Rejected. Writing unstructured text logs to console outputs does not allow systematic analysis, graphing, or automated triggering of recovery loops.
* **External LLM-as-a-Judge API**: Rejected. External evaluation engines violate the offline-local privacy boundary and add significant cost and latency.

## Trade-offs
* *Pros*:
  - Enables early detection of model quality degradation or prompt rot.
  - Allows self-healing loops to base optimization choices on structured quality metrics.
* *Cons*:
  - Generating embeddings and performing cosine similarity checks for grounding scorecards consumes local GPU compute cycles.

## Consequences
* Every model response is validated and graded before delivery.
* Developers can view and query live metrics charts from the Console.
* Automated model fallbacks can trigger if a model fails to meet the minimum grounding threshold (e.g. 0.80).
