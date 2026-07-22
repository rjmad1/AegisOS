# PHASE 3 — AGENT ARCHITECTURE

## Overview
The Agent Architecture defines a suite of highly specialized, stateless Large Language Model (LLM) agents. Each agent acts as a mathematical function: `f(State, Context) -> Decision`. Agents never execute code directly. They analyze the deterministic state graph and emit structured JSON commands or reports.

## Responsibilities
- Provide strategic direction for exploration.
- Analyze deterministic validation failures to identify root causes.
- Generate human-readable reports and regression reproduction steps.

## Interfaces
```typescript
interface IAgentRequest<TState> {
  sessionId: string;
  correlationId: string;
  currentState: TState;
  historicalContext: ExecutionEvent[];
}

interface IAgentResponse<TCommand> {
  reasoning: string; // Internal chain of thought (not executed)
  command: TCommand; // Deterministic output
  confidenceScore: number;
}
```

## Data Structures
- `AgentContext`: In-memory representation of the current prompt and retrieved RAG context.
- `EventEnvelope`: Standardized wrapper for consumed/produced events.

## Failure Modes
- **Hallucination**: Emitting an invalid JSON command or a selector that does not exist in the DOM.
- **Context Exhaustion**: The history of the session exceeds the LLM context window.

## Recovery
- **Hallucination Recovery**: Orchestrator immediately rejects invalid commands (schema validation) and prompts the agent again with the error.
- **Context Recovery**: Implement a sliding window or summarization agent to compress `historicalContext`.

## Tradeoffs
- **Specialized vs. General Agents**: We use 12 highly specialized agents rather than one "God Agent." *Tradeoff*: Increases orchestration complexity and inter-agent communication overhead, but drastically improves prompt effectiveness, token efficiency, and allows routing simpler tasks to cheaper models (e.g., Llama 3) while routing complex reasoning to GPT-4/Claude 3.5.

## Implementation Notes
- All agents use Structured Outputs (JSON Schema forced via API) to guarantee parseable responses.
- Agents are implemented as stateless serverless functions or simple stateless Node.js classes.

## Future Evolution
- Fine-tuning specialized models for specific agents (e.g., a fine-tuned model exclusively for the `Visual Auditor` that analyzes DOM + Image simultaneously).

---

## AGENT SPECIFICATIONS

### 1. Planner Agent
- **Purpose**: Define high-level business goals and workflows to test based on the application persona.
- **Responsibilities**: Break down a target application into testable user journeys. Prioritize journeys based on risk.
- **Inputs**: High-level application description, available user roles.
- **Outputs**: List of prioritized `WorkflowGoal` objects.
- **Events consumed**: `SessionStarted`, `WorkflowCompleted`
- **Events produced**: `GoalCreated`, `GoalPrioritized`
- **Internal state**: None (Stateless).
- **Persistent state**: Goals stored in Postgres.
- **Memory ownership**: Reads global session history.
- **Dependencies**: LLM API.
- **Retry policy**: 3 retries on JSON parse failure.
- **Idempotency requirements**: Generating goals for the same app description must yield similar semantic clusters.
- **Failure recovery**: Fall back to default exploratory mode (no specific goals).
- **Scaling strategy**: Horizontally scaled. One instance per active session initialization.
- **Concurrency model**: Asynchronous, runs once at start and intermittently.
- **Lifecycle**: Active only at the beginning of a session or when a major goal is completed.
- **Configuration**: `SystemPrompt` (defines persona), `MaxGoals`.
- **Future extension points**: RAG integration with Jira/Confluence to auto-generate goals from business requirements.

### 2. Navigator Agent
- **Purpose**: Determine the optimal sequence of actions to reach a specific `WorkflowGoal`.
- **Responsibilities**: Map the current state to the desired goal state.
- **Inputs**: Current `DOMHash`, `WorkflowGoal`, available interactive elements.
- **Outputs**: `TargetNode` or sequence of `ActionCommand`.
- **Events consumed**: `StateUpdated`, `NavigationFailed`
- **Events produced**: `NavigationPathCalculated`
- **Internal state**: None.
- **Persistent state**: Navigation graph paths (Postgres).
- **Memory ownership**: Scoped to the current `WorkflowGoal`.
- **Dependencies**: State Manager Graph.
- **Retry policy**: No retries. If pathing fails, it recalculates on next tick.
- **Idempotency requirements**: Strictly idempotent given the exact same graph state.
- **Failure recovery**: Hand off to Explorer Agent if Navigator is lost.
- **Scaling strategy**: High throughput, 1:1 with active workers.
- **Concurrency model**: Thread-safe, stateless execution.
- **Lifecycle**: Active during targeted test execution.
- **Configuration**: `PathfindingHeuristicWeight`.
- **Future extension points**: A* algorithm integration for deterministic pathing over known graph segments.

### 3. Explorer Agent
- **Purpose**: Discover new application states when no specific goal is active or the graph is unknown.
- **Responsibilities**: Select the most interesting unvisited edge to explore.
- **Inputs**: Unvisited edges from current Node, historical action frequencies.
- **Outputs**: Single `ActionCommand` (e.g., click unknown button).
- **Events consumed**: `NodeDiscovered`, `IdleStateReached`
- **Events produced**: `ActionCommandIssued`
- **Internal state**: None.
- **Persistent state**: Edge weights (updated in Postgres).
- **Memory ownership**: Scoped to current node.
- **Dependencies**: LLM API (for heuristic evaluation of button text, e.g., "Delete" is riskier than "Cancel").
- **Retry policy**: Retry with different temperature if stuck in a loop.
- **Idempotency requirements**: Non-idempotent by design (introduces fuzzing/randomness).
- **Failure recovery**: Choose a random unvisited edge if LLM fails.
- **Scaling strategy**: High throughput, low latency.
- **Concurrency model**: Stateless.
- **Lifecycle**: Active during exploration phases.
- **Configuration**: `ExplorationDepthLimit`, `RiskAppetite`.
- **Future extension points**: Reinforcement learning to maximize unique state discovery.

### 4. Validator Agent
- **Purpose**: Synthesize deterministic validation results and determine true business impact.
- **Responsibilities**: Read outputs from axe-core, API checks, etc., and classify them (False Positive, Minor, Critical).
- **Inputs**: `ValidationReport` array.
- **Outputs**: `VerifiedDefect` object.
- **Events consumed**: `ValidationCompleted`
- **Events produced**: `DefectLogged`
- **Internal state**: None.
- **Persistent state**: Defect tracking table.
- **Memory ownership**: Reads prior identical defects to deduplicate.
- **Dependencies**: LLM API.
- **Retry policy**: Standard API retry.
- **Idempotency requirements**: Identical reports must yield identical defect classifications.
- **Failure recovery**: Log raw validation report as "Unclassified".
- **Scaling strategy**: Scaled based on validation volume.
- **Concurrency model**: Stateless, asynchronous.
- **Lifecycle**: Triggered post-execution.
- **Configuration**: `StrictnessLevel`.
- **Future extension points**: Auto-resolution of known false positives.

### 5. Evidence Collector Agent
- **Purpose**: Intelligently filter and summarize vast amounts of deterministic evidence to save LLM context window tokens.
- **Responsibilities**: Decide which lines of a 10MB console log or HAR file are actually relevant to a specific defect.
- **Inputs**: Raw HAR, Console Logs, Stack Traces.
- **Outputs**: `SummarizedEvidence` (Token-optimized string).
- **Events consumed**: `DefectLogged`, `EvidenceGathered`
- **Events produced**: `EvidenceSummarized`
- **Internal state**: None.
- **Persistent state**: S3 pointers to original files.
- **Memory ownership**: Scoped to specific execution ID.
- **Dependencies**: Chunking/Embedding utilities.
- **Retry policy**: Retry on chunk processing failure.
- **Idempotency requirements**: Idempotent summarization.
- **Failure recovery**: Truncate evidence statically if LLM summarization fails.
- **Scaling strategy**: Compute-heavy, requires dedicated instances.
- **Concurrency model**: Map-reduce across large files.
- **Lifecycle**: Triggered when a defect requires deep analysis.
- **Configuration**: `MaxOutputTokens`.
- **Future extension points**: Vectorization of logs for semantic search.

### 6. API Auditor Agent
- **Purpose**: Analyze intercepted API traffic for security, REST compliance, and data leakage.
- **Responsibilities**: Review deterministic Schemathesis outputs and raw network payloads.
- **Inputs**: HAR file slice, OpenAPI spec.
- **Outputs**: `APIDefect`.
- **Events consumed**: `NetworkTrafficCaptured`
- **Events produced**: `APIAuditCompleted`
- **Internal state**: None.
- **Persistent state**: None.
- **Memory ownership**: Scoped to specific API request/response pair.
- **Dependencies**: LLM API.
- **Retry policy**: 3 retries.
- **Idempotency requirements**: Strict.
- **Failure recovery**: Skip audit, proceed with exploration.
- **Scaling strategy**: High concurrency.
- **Concurrency model**: Stateless.
- **Lifecycle**: Asynchronous background task.
- **Configuration**: `SensitiveDataRegex`.
- **Future extension points**: Auto-generation of Postman collections for failed APIs.

### 7. Accessibility Auditor Agent
- **Purpose**: Provide human-like context to deterministic accessibility failures (e.g., axe-core).
- **Responsibilities**: Explain *why* a missing aria-label impacts a screen reader user on this specific business flow.
- **Inputs**: `axe-core` output, DOM snippet.
- **Outputs**: `A11yContextualReport`.
- **Events consumed**: `A11yValidationFailed`
- **Events produced**: `A11yAuditCompleted`
- **Internal state**: None.
- **Persistent state**: None.
- **Memory ownership**: Scoped to the specific DOM element.
- **Dependencies**: None.
- **Retry policy**: Standard.
- **Idempotency requirements**: Strict.
- **Failure recovery**: Pass through raw axe-core output.
- **Scaling strategy**: Low priority background queue.
- **Concurrency model**: Stateless.
- **Lifecycle**: Post-validation.
- **Configuration**: `WCAG_Level`.
- **Future extension points**: Remediation code generation (auto-fixing DOM).

### 8. Performance Auditor Agent
- **Purpose**: Analyze performance traces to identify logical bottlenecks (not just network latency).
- **Responsibilities**: Review Chrome Traces and Lighthouse reports to identify inefficient rendering or heavy JS execution.
- **Inputs**: Lighthouse JSON, Trace JSON summary.
- **Outputs**: `PerformanceInsight`.
- **Events consumed**: `PerformanceDataCaptured`
- **Events produced**: `PerformanceAuditCompleted`
- **Internal state**: None.
- **Persistent state**: None.
- **Memory ownership**: Scoped to session.
- **Dependencies**: LLM API.
- **Retry policy**: Standard.
- **Idempotency requirements**: Strict.
- **Failure recovery**: Log raw metrics only.
- **Scaling strategy**: Background queue.
- **Concurrency model**: Stateless.
- **Lifecycle**: End of a workflow.
- **Configuration**: `ThresholdMs`.
- **Future extension points**: Profiling React re-renders specifically.

### 9. Visual Auditor Agent
- **Purpose**: Differentiate between intended visual changes (e.g., dynamic dates) and actual UI regressions using Vision models.
- **Responsibilities**: Review image diffs produced by `pixelmatch`.
- **Inputs**: Base Image, Target Image, Diff Image.
- **Outputs**: `VisualDefect` (True/False Positive).
- **Events consumed**: `VisualDiffFailed`
- **Events produced**: `VisualAuditCompleted`
- **Internal state**: None.
- **Persistent state**: None.
- **Memory ownership**: Scoped to specific image pair.
- **Dependencies**: GPT-4V or Claude 3.5 Sonnet (Vision capabilities).
- **Retry policy**: 3 retries (Vision APIs can be flaky).
- **Idempotency requirements**: High.
- **Failure recovery**: Flag for human review.
- **Scaling strategy**: GPU/Vision APIs are expensive; strictly rate-limited queue.
- **Concurrency model**: Stateless, asynchronous.
- **Lifecycle**: Triggered by pixelmatch threshold breach.
- **Configuration**: `DiffTolerance`.
- **Future extension points**: Identifying brand guideline violations (e.g., wrong padding).

### 10. Security Auditor Agent
- **Purpose**: Identify business-logic security flaws (e.g., IDOR) that automated scanners (ZAP) miss.
- **Responsibilities**: Analyze the sequence of actions and state changes for privilege escalation.
- **Inputs**: Session action history, state transitions.
- **Outputs**: `SecurityVulnerability`.
- **Events consumed**: `WorkflowCompleted`
- **Events produced**: `SecurityAuditCompleted`
- **Internal state**: None.
- **Persistent state**: None.
- **Memory ownership**: Full session history.
- **Dependencies**: LLM API.
- **Retry policy**: Standard.
- **Idempotency requirements**: Strict.
- **Failure recovery**: Skip audit.
- **Scaling strategy**: Run once per completed high-value workflow.
- **Concurrency model**: Stateless.
- **Lifecycle**: Post-workflow.
- **Configuration**: `ThreatModelProfile`.
- **Future extension points**: Generating custom Nuclei templates based on findings.

### 11. Regression Generator Agent
- **Purpose**: Translate a graph path of a found defect into a deterministic, runnable test script.
- **Responsibilities**: Output Playwright/TypeScript code that reproduces the bug exactly.
- **Inputs**: `DefectLogged`, `ActionHistory` (Path through the graph).
- **Outputs**: `PlaywrightTestCode` (string).
- **Events consumed**: `DefectLogged`
- **Events produced**: `RegressionScriptGenerated`
- **Internal state**: None.
- **Persistent state**: Generated scripts stored in Postgres.
- **Memory ownership**: Path history.
- **Dependencies**: LLM API (Coding capabilities).
- **Retry policy**: Standard.
- **Idempotency requirements**: Scripts must be functionally identical across retries.
- **Failure recovery**: Output manual reproduction steps instead of code.
- **Scaling strategy**: Background queue.
- **Concurrency model**: Stateless.
- **Lifecycle**: Triggered on confirmed defect.
- **Configuration**: `TargetTestFramework` (e.g., `@playwright/test`).
- **Future extension points**: Auto-committing tests to the application's repository via GitHub API.

### 12. Report Writer Agent
- **Purpose**: Synthesize all session data into an executive summary.
- **Responsibilities**: Aggregate defects, coverage metrics, and performance insights into a Markdown or PDF report.
- **Inputs**: All session `VerifiedDefect`s, `PerformanceInsight`s, Coverage graph.
- **Outputs**: `FinalReport` (Markdown).
- **Events consumed**: `SessionCompleted`
- **Events produced**: `ReportGenerated`
- **Internal state**: None.
- **Persistent state**: Reports stored in S3/Postgres.
- **Memory ownership**: Entire session metadata.
- **Dependencies**: LLM API.
- **Retry policy**: Standard.
- **Idempotency requirements**: High.
- **Failure recovery**: Generate basic tabular report without LLM synthesis.
- **Scaling strategy**: Run once per session end.
- **Concurrency model**: Stateless.
- **Lifecycle**: End of session.
- **Configuration**: `ReportFormat`, `AudienceLevel` (Exec vs Developer).
- **Future extension points**: Slack/Teams integration for alert routing.
