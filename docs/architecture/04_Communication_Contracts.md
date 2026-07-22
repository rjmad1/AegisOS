# PHASE 4 — COMMUNICATION CONTRACTS

## Overview
All inter-process communication between the Orchestrator, Agents, and Deterministic Workers occurs via strictly typed JSON payloads over Redis pub/sub and Redis lists. This decoupled architecture ensures that the AI layer and the Execution layer can evolve independently, scale horizontally, and be implemented in different programming languages if necessary.

## Responsibilities
- Provide a single source of truth for all data shapes (`packages/shared-contracts`).
- Enforce schema validation at boundaries (Zod validation).
- Handle backward compatibility via explicit message versioning.

## Interfaces
- `IEventPublisher`: Interface for emitting state changes.
- `ICommandDispatcher`: Interface for queuing commands to workers.
- `IContractValidator`: Validates incoming JSON against schemas.

## Data Structures
```typescript
interface Envelope<T> {
  messageId: string;
  correlationId: string;
  timestamp: string; // ISO8601
  version: 'v1';
  type: string;
  payload: T;
}
```

## Failure Modes
- Schema mismatch (e.g., worker expects `v2` payload, orchestrator sends `v1`).
- Malformed JSON from LLM output.

## Recovery
- **Schema Mismatch**: Reject message to Dead Letter Queue (DLQ). Alert via observability layer.
- **LLM Malformed JSON**: The Orchestrator's internal validator catches this before it hits the message bus and immediately triggers an LLM retry.

## Tradeoffs
- **Strict Typing vs. Flexibility**: Defining explicit contracts for every event slows down initial development but entirely eliminates runtime `undefined` errors during distributed execution.

## Implementation Notes
- Use `zod` for defining schemas. Compile Zod schemas to JSON Schema for the LLM `tools` (Structured Outputs) definitions.
- Publish `shared-contracts` as an internal NPM package.

## Future Evolution
- Migration to gRPC/Protobuf if Redis JSON parsing becomes a CPU bottleneck at high scale.

---

## COMMUNICATION CONTRACTS DEFINITION

### Message Format & JSON Schema
All messages use the `Envelope<T>` format.
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ActionCommandEnvelope",
  "type": "object",
  "properties": {
    "messageId": { "type": "string", "format": "uuid" },
    "correlationId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "version": { "type": "string", "const": "v1" },
    "type": { "type": "string", "const": "ACTION_COMMAND" },
    "payload": { "$ref": "#/definitions/ActionCommand" }
  },
  "required": ["messageId", "correlationId", "timestamp", "version", "type", "payload"]
}
```

### Shared Interfaces (TypeScript)
```typescript
export type CommandType = 'CLICK' | 'TYPE' | 'NAVIGATE' | 'HOVER' | 'EXTRACT' | 'WAIT_FOR';

export interface ActionCommand {
  commandType: CommandType;
  selector?: string;
  value?: string;
  timeoutMs?: number;
}
```

### Command Contracts
Used by AI Agents to direct the Deterministic Worker.
- **Payload**: `ActionCommand`
- **Example Payload**:
```json
{
  "commandType": "TYPE",
  "selector": "input[name='username']",
  "value": "test_user_123"
}
```

### Response Contracts
Used by the Worker to report back to the Orchestrator.
- **Payload**: `ExecutionResult`
```typescript
interface ExecutionResult {
  success: boolean;
  resultingDomHash: string;
  errorDetail?: string;
  evidenceId: string;
}
```

### Error Contracts
Standardized error reporting across the system.
- **Payload**: `SystemError`
```typescript
interface SystemError {
  code: 'TIMEOUT' | 'SELECTOR_NOT_FOUND' | 'NETWORK_FAILURE' | 'LLM_FAILURE';
  message: string;
  stack?: string;
}
```

### Event Contracts
Emitted when significant state changes occur (consumed by Auditors/Reviewers).
- **Types**: `SessionStarted`, `NodeDiscovered`, `DefectLogged`, `WorkflowCompleted`.
```typescript
interface NodeDiscoveredEvent {
  nodeId: string;
  url: string;
  domHash: string;
}
```

### Queue Contracts
Defines the Redis Lists used for communication.
- `queue:worker:commands` -> Processed by Execution Workers.
- `queue:orchestrator:results` -> Processed by Orchestrator.
- `queue:auditor:*` -> Fan-out queues for various Auditor Agents.

### API Contracts
REST/GraphQL endpoints for the Dashboard UI to interact with the Orchestrator.
- `POST /api/sessions/start`
- `GET /api/sessions/:id/graph`
- `GET /api/defects/:id`

### State Transition Contracts
Defines the valid movements in the Graph DB.
```typescript
interface StateTransition {
  fromNodeId: string;
  toNodeId: string;
  edgeAction: ActionCommand;
}
```

---

## VERSIONING & BACKWARD COMPATIBILITY

### Versioning Strategy
- Explicit `version` string in every envelope (`v1`, `v2`).
- Breaking changes to payloads require a version bump.
- Minor additions (new optional fields) do not bump the version.

### Backward Compatibility Strategy
- **Consumers MUST ignore unknown fields** in JSON payloads.
- If a new version `v2` is introduced, the Orchestrator MUST support both `v1` and `v2` endpoints/handlers during the migration window.
- Workers always process `v1` until they are drained and redeployed to accept `v2`.
