# PHASE 13 — IMPLEMENTATION ROADMAP

## Overview
This roadmap dictates the progressive buildout of the Autonomous Testing Platform. By adhering to the principle of "Progressive Implementation," we build the deterministic foundations first, ensuring value is delivered even before the LLM agents are attached.

## Responsibilities
- Provide a structured timeline for engineering teams.
- Manage dependencies between phases.

## Interfaces
- N/A (Project Management Artifact).

## Data Structures
- N/A.

## Failure Modes
- Attempting to build the AI orchestration before the deterministic browser execution is stable, leading to debugging hell where it's unclear if the LLM hallucinated or Playwright crashed.

## Recovery
- Strictly enforce passing quality gates for Milestone 1 before beginning Milestone 2.

## Tradeoffs
- **Time to Value**: Delaying the "Autonomous" part until Milestone 2 means stakeholders won't see "AI" working immediately. *Tradeoff justification*: A reliable, deterministic engine driven by a static queue is infinitely more valuable than a flaky AI script.

## Implementation Notes
- Agile sprints (2-week cadence) should map directly to the deliverables below.

## Future Evolution
- Once Production (Milestone 3) is stable, move towards an open-source or SaaS model.

---

## MILESTONES

### Milestone 1: MVP (Weeks 1-4)
**Focus**: The Deterministic Foundation.
- **Goals**: Build the monorepo, State DB, Redis Queue, and the Deterministic Worker.
- **Deliverables**:
  - `shared-contracts` package.
  - `browser-engine` package (Playwright wrapper).
  - PostgreSQL schema for Graph and State.
  - Basic Node.js worker that pops JSON from Redis and clicks.
- **Dependencies**: AWS account, Postgres/Redis infrastructure.
- **Risks**: Playwright Docker container memory tuning.
- **Acceptance Criteria**: Worker can successfully complete a hardcoded 5-step login sequence pushed via Redis.
- **Success Metrics**: 0% flakiness on 100 runs of the static sequence.
- **Estimated Implementation Complexity**: Medium.

### Milestone 2: Production (Weeks 5-8)
**Focus**: The AI Brain.
- **Goals**: Implement the Orchestrator and core Agents (Planner, Explorer, Validator).
- **Deliverables**:
  - `apps/orchestrator` service.
  - Integration with OpenAI/Anthropic SDKs.
  - Graph traversal logic (preventing loops).
- **Dependencies**: Milestone 1, LLM API Access.
- **Risks**: Token costs exploding during testing.
- **Acceptance Criteria**: System can autonomously discover 90% of a known test application's state graph without human intervention.
- **Success Metrics**: Cost per exploration session < $1.00.
- **Estimated Implementation Complexity**: High.

### Milestone 3: Future Enhancements (Weeks 9-12)
**Focus**: Evidence, Validation, and Observability.
- **Goals**: Attach the deterministic validators (axe-core, Lighthouse) and the Evidence Pipeline.
- **Deliverables**:
  - S3 upload stream for HAR/Traces.
  - `validation-engine` package.
  - Auditor Agents (A11y, Security, API).
  - OpenTelemetry integration.
- **Dependencies**: Milestone 2.
- **Risks**: S3 storage costs, pipeline bottlenecking on validation.
- **Acceptance Criteria**: Every discovered node automatically runs A11y checks; failures are summarized by the LLM.
- **Success Metrics**: Trace retention policies successfully delete data > 30 days old.
- **Estimated Implementation Complexity**: Medium.
