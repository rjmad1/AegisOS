# ADR-003: Unified Event-Driven Registry

## Status
Approved

## Context
Workstation files, logs, and outputs were previously managed in a disorganized fashion, scattered across folders without unified lifecycles, metadata indexing, or parent-child context.

## Decision
Promote artifacts to first-class registry entities. Everything generated or stored (configs, logs, text extractions, model outputs) must reside in the Artifact Registry. We introduce unified lifecycle states (Draft -> Processing -> Available/Failed -> Archived -> Deleted) and publish events via a system event bus (`IEventBus`) to decouple processing components like search indexers and notification engines.

## Alternatives Considered
- **Direct file system access**: Lacked search, schema tagging, and audit trail.
- **Heavy Database Entity Relationships**: Over-complicated for simple local workspace monitoring.

## Trade-offs
- *Pros*: Provides a unified schema for logs, reports, and generated output. Decouples indexing and notifications.
- *Cons*: Requires an event-dispatch mechanism inside repository operations.

## Consequences
- Every output file generated is registered, indexed, and visible inside the Console.
- Indexing plugins can hook into the event bus to automatically update indices.
