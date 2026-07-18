# ADR-013: Command & Control Subsystem Architecture

## Status
Accepted (Approved)

## Context
AegisOS is an enterprise-grade AI workstation management platform. Remote administration and workstation control actions must be executed securely, preventing unauthorized mutation, replay attacks, or unverified changes. We require a secure Command & Control (C2) pathway that enables mobile companion apps to issue workstation mutations (e.g. system power controls, agent registry manipulation, model reloading, and infrastructure service reboots) safely.

## Decision
We have designed and implemented a hardened, secure Command & Control subsystem. Key architectural decisions include:

1. **Cryptographic Validation**: Every command issued via a mobile pathway must be cryptographically signed by an approved client's ECDSA key pair (e.g., generated inside the iOS Secure Enclave or Android KeyStore).
2. **Replay Protection**: Commands include unique transaction nonces and timestamp headers. The Command Bus enforces strict clock skew boundaries (5 minutes max) and rejects duplicate nonces to prevent replay attacks.
3. **Dynamic Risk-Based Policies**: Actions are classified into risk categories (Low, Medium, High, Critical). Operations permissions are verified against RBAC roles:
   - Operators can execute low and medium risk actions.
   - Administrators bypass approval requirements (`AUTO`) and can execute critical/high actions.
   - Viewers are rejected from executing mutations.
4. **Approval Gate Engine**: 
   - `BYPASS`/`AUTO` strategies allow immediate enqueuing.
   - `MANUAL`/`MULTI_STAGE` hold execution, requiring explicit human approval with digital signatures.
5. **Execution Worker Pool**: The Execution Engine runs worker loops that process commands based on priority weights (`CRITICAL` > `HIGH` > `MEDIUM` > `LOW`) rather than simple FIFO ordering.
6. **Compensating Action Rollbacks**: Commands define compensating rollback instructions. Upon execution failure or manual rollback trigger, the Rollback Engine reverses the operation.

## Consequences
- **Security**: Complete protection against unauthorized execution, man-in-the-middle replays, and permission elevation.
- **Traceability**: Audit events are generated at initiation, approval, execution, and rollback stages, syncing into database logs.
- **Resilience**: Programmatic rollbacks ensure the workstation returns to a stable state if updates degrade performance.
