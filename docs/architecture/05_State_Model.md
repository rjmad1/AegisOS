# PHASE 5 — STATE MODEL

## Overview
State management is the critical foundation of the deterministic execution philosophy. Because the LLM does not execute actions, it must have a perfect, mathematical representation of the application's state to reason about. The State Model defines explicit, immutable records of what has occurred, who owns that data, and how long it lives.

## Responsibilities
- Ensure graph integrity (Nodes and Edges).
- Isolate execution state from AI context.
- Prevent state-driven infinite loops (e.g., getting stuck toggling a checkbox).

## Interfaces
- `IStateStore`: Generic interface for CRUD operations on state entities.
- `IGraphQuery`: Interface for querying graph reachability and coverage.

## Data Structures
```typescript
interface StateTransitionRecord {
  timestamp: string;
  previousStateId: string;
  newStateId: string;
  triggeringEvent: string;
}
```

## Failure Modes
- **State Desync**: The DB records a node visit, but the browser actually crashed before rendering it.
- **State Bloat**: Dynamic DOM elements (e.g., clocks) cause every single page load to generate a new unique state hash.

## Recovery
- **Desync**: Execution engine uses transactions; state is only committed upon full network-idle verification.
- **Bloat**: Deterministic DOM normalization (stripping `id`s, times, dynamic CSS classes) occurs *before* hashing.

## Tradeoffs
- **PostgreSQL vs In-Memory (Redis)**: Storing the entire state graph in Postgres adds latency to the AI prompt generation cycle. *Tradeoff*: Ensures durability and enables cross-session graph merging, which is impossible if state is wiped on crash.

## Implementation Notes
- Use `Prisma` or `Drizzle ORM` to enforce strict TypeScript models mapping to the PostgreSQL schema.

## Future Evolution
- Implementing a Time-Travel debugger feature where any historical state can be re-hydrated directly into a developer's local browser context.

---

## EXPLICIT STATE DEFINITIONS

For every state type, the following contract is strictly defined:

### 1. Browser State
Represents the physical Playwright context.
- **Lifecycle**: Created at worker job start, destroyed at job end.
- **Persistence**: Ephemeral (Memory/RAM).
- **Transitions**: `Idle -> Navigating -> Rendering -> NetworkIdle`.
- **Ownership**: Deterministic Worker.
- **Recovery**: Recreate context and replay navigation path from DB.
- **Expiration**: Job completion or timeout (default 60s).

### 2. Application State
The normalized structural hash of the DOM.
- **Lifecycle**: Created when a new layout is discovered.
- **Persistence**: Postgres (`Nodes` table).
- **Transitions**: Mutates only if the base layout changes.
- **Ownership**: State Manager.
- **Recovery**: Recalculated if schema changes.
- **Expiration**: Never (persists for historical reporting).

### 3. Workflow State
Tracks progress towards a specific `WorkflowGoal`.
- **Lifecycle**: Created by Planner, closed when goal is met or abandoned.
- **Persistence**: Postgres (`Workflows` table).
- **Transitions**: `NotStarted -> InProgress -> Completed | Failed`.
- **Ownership**: Orchestrator.
- **Recovery**: Resume from last known good Checkpoint State.
- **Expiration**: End of exploration session.

### 4. Agent State
Tracks the internal context window of a specific LLM agent invocation.
- **Lifecycle**: Per request to the LLM API.
- **Persistence**: Ephemeral (Memory).
- **Transitions**: `PromptBuilt -> AwaitingAPI -> Parsed`.
- **Ownership**: Agent Core.
- **Recovery**: Re-trigger API call.
- **Expiration**: Upon API response return.

### 5. Execution State
Tracks the status of a specific `ActionCommand` in the worker queue.
- **Lifecycle**: Created when command dispatched, closed when result returned.
- **Persistence**: Redis.
- **Transitions**: `Queued -> Processing -> Succeeded | Failed`.
- **Ownership**: Task Queue / Redis.
- **Recovery**: Requeue if worker node dies (Dead Letter Queue routing).
- **Expiration**: 24 hours (for debugging stuck queues).

### 6. Checkpoint State
Known "safe" application states (e.g., "Logged in, at Dashboard").
- **Lifecycle**: Created manually or inferred when multiple paths converge.
- **Persistence**: Postgres (Tagged Node).
- **Transitions**: `Unverified -> Verified`.
- **Ownership**: State Manager.
- **Recovery**: Used TO recover other states.
- **Expiration**: Never.

### 7. Recovery State
Instructions on how to get from the initial URL to the current node.
- **Lifecycle**: Dynamic property calculated on demand via shortest-path query.
- **Persistence**: Calculated via CTE in Postgres, not stored directly.
- **Transitions**: Updates as shorter paths are discovered.
- **Ownership**: Orchestrator Graph Engine.
- **Recovery**: N/A.
- **Expiration**: N/A.

### 8. Session State
High-level container for an entire test run.
- **Lifecycle**: Created when a test run starts, closed when all goals are met.
- **Persistence**: Postgres (`Sessions` table).
- **Transitions**: `Initializing -> Running -> Summarizing -> Closed`.
- **Ownership**: Orchestrator.
- **Recovery**: Cannot be recovered if forcefully terminated, but partial data remains in DB.
- **Expiration**: Retained for compliance (e.g., 90 days).

### 9. Authentication State
Tokens, cookies, and local storage data required to interact with the app.
- **Lifecycle**: Created at session start, injected into Browser State.
- **Persistence**: Encrypted in Postgres / Secret Manager.
- **Transitions**: `Valid -> Expired -> Renewed`.
- **Ownership**: Orchestrator / Secret Manager.
- **Recovery**: Orchestrator triggers an explicit "Login" workflow to renew.
- **Expiration**: Matches token JWT expiry.

### 10. Permission State
The mapped roles available to the current Authentication State (e.g., Admin vs User).
- **Lifecycle**: Static during a session.
- **Persistence**: Postgres (`SessionMeta`).
- **Transitions**: None.
- **Ownership**: Planner Agent.
- **Recovery**: N/A.
- **Expiration**: End of session.

### 11. Navigation State
The mathematical Graph (Nodes = DOM Hashes, Edges = ActionCommands).
- **Lifecycle**: Persists and grows across multiple sessions.
- **Persistence**: Postgres (`Nodes`, `Edges`).
- **Transitions**: Continually appending new edges.
- **Ownership**: State Manager.
- **Recovery**: Backups via standard DB mechanisms.
- **Expiration**: Never.

### 12. Testing State
The configuration for the current run (target URL, heuristics, enabled validators).
- **Lifecycle**: Static per session.
- **Persistence**: Postgres (`SessionConfig`).
- **Transitions**: None.
- **Ownership**: User/CI trigger.
- **Recovery**: N/A.
- **Expiration**: End of session.

### 13. Retry State
Tracks how many times an ActionCommand has failed sequentially.
- **Lifecycle**: Exists only while an edge is failing.
- **Persistence**: Redis (Hash map attached to Edge ID).
- **Transitions**: `0 -> 1 -> 2 -> 3(Max) -> Dead`.
- **Ownership**: Execution Worker.
- **Recovery**: Resets upon success.
- **Expiration**: Cleared when maximum retries hit or command succeeds.

### 14. Evidence State
Pointers and metadata for captured artifacts.
- **Lifecycle**: Created when validation engine runs, updated when S3 upload completes.
- **Persistence**: Postgres (`Evidence` table).
- **Transitions**: `Capturing -> Uploading -> Available`.
- **Ownership**: Evidence Pipeline.
- **Recovery**: Re-upload if `Available` transition fails.
- **Expiration**: Evicted from S3 based on lifecycle rules (e.g., 30 days).
