# 4. Loose Ends Register

## Resolved Loose Ends
1. **`session.service.ts`**: The `TODO(auth)` for OIDC rotation was formally deferred as an intentional architecture shortcut (`ponytail:`) until an external auth provider is established.
2. **`IngestMeetingCommand.ts`**: The mocked/placeholder logic for agent execution was rewritten to use standard Durable Execution sagas.
3. **`EngineeringOperationsCenter.ts` (and related scanners)**: The documentation falsely classifying these files as tech debt was rectified.
4. **Missing RC9 Feature: Swarms**: `SpawnAgentSwarmCommand.ts` implemented.
5. **Missing RC9 Feature: Multi-Modal**: `ProcessMultiModalTelemetryCommand.ts` implemented.
6. **Missing RC9 Feature: Model Swapping**: `SwitchModelRuntimeCommand.ts` implemented.

## Remaining Loose Ends (Intentional)
- **OIDC Refresh Token Exchange**: Deferred (`ponytail:`)
- **Advanced Model Capability Mapping**: The ModelRuntime provides basic mapping, but fine-grained model capability limits are deferred.
