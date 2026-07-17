# ADR-011: Event-Driven System Decoupling

## Status
Approved

## Context
As AegisOS scales, tight coupling between the dashboard frontend, workflow orchestrator, and local inference models leads to blocking execution loops, difficult-to-trace failures, and tight runtime bindings. To ensure resilience and allow sub-systems to react asynchronously, a publish-subscribe event model is required.

## Decision
All major platform interactions will emit structured events using the `HardenedEventBus`. Components must subscribe only to events relevant to their primary responsibility. Key lifecycle events include:
* `RequestReceived`
* `WorkflowStarted`
* `ToolInvoked`
* `PolicyViolation`
* `ModelSelected`
* `ResponseValidated`

The `HardenedEventBus` enforces strict schema validation on all events, and routes malformed or failed event notifications to a persistent Dead Letter Queue (DLQ).

## Alternatives Considered
* **Direct REST API Invocations**: Rejected. Direct synchronous requests increase execution latency and fail to provide decoupled audit trails.
* **Apache Kafka / RabbitMQ**: Rejected. Setting up separate heavy enterprise message queue containers is overly complex and memory-intensive for a local-first workstation environment.

## Trade-offs
* *Pros*:
  - Completely decouples service interfaces, improving system maintainability and scaling.
  - Generates a chronological, unified system audit log (`event_audit.json`).
* *Cons*:
  - Execution paths are asynchronous, requiring websocket or Server-Sent Events (SSE) channels for real-time frontend updates.

## Consequences
* Services can fail or restart without interrupting adjacent components.
* Custom event handlers (e.g. self-healing alerts) can be registered dynamically without modifying core gateways.
