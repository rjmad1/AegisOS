# PHASE 11 — OBSERVABILITY

## Overview
Observability is critical in an AI-driven platform. Because the LLM acts autonomously, engineers must be able to trace exactly *why* it made a decision, how much that decision cost in API tokens, and how long the deterministic execution took. The platform uses OpenTelemetry to emit standard metrics, logs, and traces.

## Responsibilities
- Track AI token usage and cost accounting.
- Monitor worker pool health and queue latency.
- Provide real-time dashboards for active exploration sessions.

## Interfaces
- `ITelemetryService`: Wrapper around OpenTelemetry Node SDK.

## Data Structures
```typescript
interface TokenEvent {
  agentName: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUSD: number;
  correlationId: string;
}
```

## Failure Modes
- **Metrics Dropped**: Telemetry collector (e.g., Datadog agent) goes down.
- **Trace Explosion**: Capturing every Redis command generates too much trace data.

## Recovery
- **Dropped Metrics**: Acceptable data loss. Observability must never block execution (fail-open).
- **Trace Explosion**: Implement probabilistic sampling (e.g., sample 10% of sessions) at the OpenTelemetry collector level.

## Tradeoffs
- **Custom Dashboards vs SaaS**: Building custom React dashboards vs using Grafana/Datadog. *Tradeoff*: Emit standard OTLP (OpenTelemetry Protocol) so any backend can be used, minimizing lock-in.

## Implementation Notes
- Every LLM request MUST include the `correlationId` of the current exploration edge to stitch together the AI reasoning with the Playwright action.

## Future Evolution
- AI-driven anomaly detection on the metrics stream (e.g., "Worker 3 is taking 200% longer to execute CLICK actions than Worker 1").

---

## OBSERVABILITY PILLARS

### Metrics
- `ai.tokens.total` (Counter)
- `queue.latency.ms` (Histogram)
- `browser.crash.count` (Counter)
- `coverage.percentage` (Gauge)

### Tracing
Distributed tracing spans across:
1. `Orchestrator.ProcessState`
2. `Agent.GenerateCommand`
3. `Queue.Wait`
4. `Worker.ExecuteAction`
5. `Validation.RunSuite`

### Logging
Structured JSON logging only.
- `INFO`: Normal transitions.
- `WARN`: LLM JSON parse failures (retrying).
- `ERROR`: Worker crash or database disconnect.

### Dashboards
- **Executive**: Cost per Session, Bugs Found, Coverage Growth.
- **Engineering**: Queue Depth, P99 Latency per action, Error Rates.

### Health Checks
- `GET /health/liveness`: Returns 200 if Orchestrator process is running.
- `GET /health/readiness`: Returns 200 if DB and Redis are connected.

### Alerts
- **Token Budget Exceeded**: Triggers if a single session exceeds $5.00 in LLM costs.
- **Queue Backup**: Triggers if tasks sit in Redis for > 60 seconds.

### SLIs & SLOs
- **SLI**: Percentage of AI commands successfully parsed on first try. **SLO**: 99%.
- **SLI**: Deterministic worker execution success rate (no unhandled crashes). **SLO**: 99.9%.

### Token Usage & AI Costs
Calculated dynamically based on the model string returned in the API response. Aggregated daily to prevent runaway spending on hallucinatory loops.

### Performance Metrics
Track the specific time it takes the target application to reach `networkidle`. If a specific URL path takes > 10s to load consistently, it is flagged by the Performance Auditor automatically.
