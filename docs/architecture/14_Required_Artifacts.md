# REQUIRED ARTIFACTS

## Overview
This document contains the strictly mandated architectural governance artifacts. These matrices and registers act as the final check to ensure the architecture meets the constraints and requirements outlined in the initial specification.

## Responsibilities
- Document explicit architectural decisions (ADRs).
- Map requirements to concrete code modules.
- Identify and mitigate risks before coding begins.

## Interfaces
- N/A.

## Data Structures
- N/A.

## Failure Modes
- Proceeding to implementation without resolving high-impact risks identified in the register.

## Recovery
- Revert to architecture planning phase until mitigations are formally signed off.

## Tradeoffs
- Generating exhaustive documentation takes time away from coding. *Tradeoff*: In a complex AI/Distributed system, skipping documentation leads to catastrophic system failure.

## Implementation Notes
- These artifacts should be moved to a living Wiki (e.g., Confluence) or maintained in version control as markdown alongside the code.

## Future Evolution
- Automated generation of the Traceability Matrix based on code annotations.

---

## ARCHITECTURE DECISION RECORDS (ADR)

### ADR 001: Execution Orchestration via Redis
- **Problem**: Need to distribute testing tasks to multiple parallel workers reliably.
- **Chosen Solution**: Redis Lists (`BLPOP`/`RPUSH`) for task queues.
- **Alternatives Considered**: Kafka, RabbitMQ, SQS.
- **Tradeoffs**: Redis lacks native dead-letter queues (requires custom Lua scripts or external monitoring), but provides the ultra-low latency required for real-time browser interaction steps.
- **Rejected Options**: Kafka (excessive operational overhead for this scale).
- **Future Implications**: If tasks exceed Redis RAM, we must migrate to a disk-backed queue.

### ADR 002: Deterministic Validation over LLM Validation
- **Problem**: Need to verify if a UI state is accessible, visually correct, and secure.
- **Chosen Solution**: Hardcoded wrappers around axe-core, pixelmatch, and ZAP.
- **Alternatives Considered**: Asking GPT-4V to "look at the screenshot and find accessibility issues."
- **Tradeoffs**: Requires maintaining integrations with multiple open-source tools.
- **Rejected Options**: Pure LLM validation (rejected due to high hallucination rates, non-determinism, and extreme token cost).
- **Future Implications**: The system will always be constrained by the capabilities of the underlying open-source validation tools.

---

## TRACEABILITY MATRIX

| Requirement | Architecture Component | Agent | Implementation Module | Validation Method |
|---|---|---|---|---|
| **Deterministic execution first** | Execution Layer | N/A | `apps/worker-node`, `browser-engine` | Unit Tests on Execution Result |
| **AI reasoning only when valuable**| AI Layer | Explorer, Planner | `apps/orchestrator`, `agents/` | Token Usage Metrics |
| **Evidence-first validation** | Evidence Pipeline | Evidence Collector | `evidence-pipeline` | S3 Upload Verification |
| **State-aware exploration** | Control Layer | Explorer | `state-manager` | Postgres Graph Queries |
| **Cost-aware AI usage** | Observability | N/A | OpenTelemetry spans | Daily Cost Dashboard |
| **Explicit contracts** | Shared Layer | N/A | `shared-contracts` | TypeScript Compiler / Zod |

---

## RISK REGISTER

| Risk Type | Description | Likelihood | Impact | Mitigation | Fallback | Monitoring |
|---|---|---|---|---|---|---|
| **Technical** | State space explosion on dynamic pages | High | High | DOM normalization before hashing | Cap max nodes per session | DB Node Count SLI |
| **Operational** | S3 storage costs ballooning | Medium | High | Delete video/HAR for successful checks | Truncate retention to 7 days | AWS Billing Alarms |
| **Scalability** | Redis CPU bottleneck at high concurrency | Low | Medium | Redis Cluster sharding | Single node scale-up | Redis CPU Metric |
| **Security** | AI agent generates SQL injection that breaks staging DB | Low | High | Deterministic data generators only | Restore staging DB from snapshot| WAF / DB Logs |
| **AI** | LLM Provider (OpenAI/Anthropic) goes down | Medium | High | Decoupled queue allows pausing | Run deterministic regressions only| LLM Error Rate SLI |
| **Reliability** | Playwright memory leaks crashing workers | High | Medium | Recycle browser context aggressively | Docker auto-restart | Container Memory |

---

## ACCEPTANCE CRITERIA

| Subsystem | Metric | Target |
|---|---|---|
| **Token Optimization** | Maximum token consumption per session | < 50,000 tokens |
| **Execution Engine** | Maximum execution latency (Queue -> Browser) | < 100ms overhead |
| **Exploration Engine**| Coverage targets | > 80% of interactive DOM elements discovered |
| **Resilience** | Failure recovery time (Worker crash -> Retry) | < 5 seconds |
| **Scalability** | Scalability targets | Support 50 concurrent workers per orchestrator |
| **Observability** | Observability coverage | 100% of LLM calls traced and costed |
| **Validation Engine** | Reliability targets | 0% false positives caused by LLM hallucination |

---

## IMPLEMENTATION READINESS REVIEW

### Known Assumptions
- The target applications are accessible via standard HTTP/HTTPS and do not require complex hardware tokens (e.g., YubiKey) for initial authentication.
- A staging or testing environment is available (autonomous exploration *should not* run in production).

### Unknowns
- The exact rate at which dynamic JavaScript frameworks (React/Vue) will trigger false-positive state changes due to hidden attribute mutations.

### External Dependencies
- PostgreSQL (State/Config)
- Redis (Queues/Locks)
- S3/MinIO (Evidence Storage)
- OpenAI/Anthropic APIs (Agents)

### Open Questions
- Do the target applications implement aggressively strict rate-limiting (WAF/Cloudflare) that might block the parallel workers?

### Potential Blockers
- Enterprise network configurations blocking outbound connections from the worker nodes to the LLM APIs.

### Recommended Implementation Order
1. Repository setup (Turborepo, Linting, Shared Contracts).
2. Infrastructure provisioning (Docker Compose for Postgres/Redis).
3. Deterministic execution worker (Playwright wrapping).
4. State Manager (Postgres graph logic).
5. Orchestrator Event Loop.
6. AI Agents (Planner & Explorer).

### Prerequisites Before Coding
- Formal approval of ADRs.
- Provisioning of LLM API keys.
- Setup of the CI/CD repository structure.

### Risk Hotspots
- **The DOM Hashing Algorithm**: This is the single most critical point of failure. If it is too strict, the graph won't grow. If it is too loose, the graph explodes. It requires intense unit testing before integration.

### Anything Requiring Stakeholder Clarification
- Confirmation of budget limits for the LLM API during the initial MVP testing phase.

### Implementation Confidence Score
**95 / 100**
*The architecture heavily relies on proven, deterministic components (Postgres, Redis, Node.js, Playwright) and isolates the high-risk AI components into strict, manageable boundaries. It is fully ready for engineering implementation.*
