# ADR-004: Pipeline & Worker Processing Architecture

## Status
Approved

## Context
Running long-running tasks, such as bulk GGUF model ingestion, file vectorization, and data conversions, directly in the HTTP request/response cycle would block the Next.js server threads and trigger timeouts.

## Decision
Implement a decoupled background job queue. The Next.js API endpoints enqueue tasks to a job processor that delegates work to worker threads. Processing flows are organized into linear pipeline stages (Parse -> Chunk -> Embed -> Index) with exponential backoff retry policies.

## Alternatives Considered
- **Synchronous Execution**: Rejected due to high request latencies and connection timeouts.
- **External queue engines (Redis, RabbitMQ)**: Rejected as they would require installing external services, breaking local standalone dependency rules. An in-memory queue satisfies single-workstation needs.

## Trade-offs
- *Pros*: Minimizes user interface latency and enables robust error recovery.
- *Cons*: Introduces state tracking for background jobs (pending, active, completed, failed).

## Consequences
- Long-running commands execute asynchronously.
- The UI can poll or receive server-sent events for progress updates.
