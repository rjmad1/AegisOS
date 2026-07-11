# ADR-001: Contract-First Versioned API Boundaries

## Status
Approved

## Context
The workstation dashboard frontend previously communicated with client-side mocks and system operations using mixed direct imports and client-side stores. To isolate infrastructure and allow backend scaling (e.g., transition to a remote server or Cloud Run instance), a clean boundary is required.

## Decision
All communication between the client UI and the workstation platform services is routed through formal versioned REST endpoints prefixed with `/api/v1/`. The initial implementation defines these endpoint contracts returning `501 Not Implemented` mock payloads containing schema details.

## Alternatives Considered
- **Direct client-side hooks**: Rejected due to high coupling and lack of server-side validation capabilities.
- **tRPC / GraphQL**: Rejected due to the added weight and overhead in a lightweight local workstation setting. Standard REST API provides maximum compatibility.

## Trade-offs
- *Pros*: Makes the API contract discoverable, testable, and version-safe. Client development can run in parallel and stub/mock endpoints.
- *Cons*: Adds thin route definitions and controllers on the Next.js server side.

## Consequences
- The client UI layer is decoupled from physical hardware implementations.
- Endpoint schemas are documented directly within the stub payloads.
- Allows zero-downtime transition to real backend adapters in the future.
