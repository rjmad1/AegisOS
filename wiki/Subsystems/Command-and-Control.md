# Command & Control Subsystem

> **Purpose**: Secure remote command execution via mobile companion apps.
> **Status**: ACTIVE · CANONICAL
> **Source**: [ADR-013](../../adr/ADR-013-Command-And-Control-Subsystem.md)

---

**Navigation**: [Home](../Home.md) · [Subsystems](AI-Runtime.md) > Command & Control
**Related**: [Mobile Overview](../Mobile/Overview.md) · [Security Architecture](../Architecture/Security-Architecture.md)

---

📄 **[ADR-013: Command & Control Subsystem Architecture](../../adr/ADR-013-Command-And-Control-Subsystem.md)**

## Key Design Decisions

- **ECDSA Cryptographic Signatures** — Every command cryptographically signed
- **Replay Protection** — Nonces + clock skew bounds (5 min max)
- **Risk-Based Policies** — Dynamic Low/Medium/High/Critical classification
- **Approval Gates** — BYPASS, AUTO, MANUAL, MULTI_STAGE strategies
- **Priority-Weighted Execution** — Worker pool processes by priority, not FIFO
- **Compensating Rollbacks** — Automatic reversal on failure

---

**Previous**: [Intent Resolution](Intent-Resolution-Engine.md) · **Next**: [Autonomic Transformation](Autonomic-Transformation.md) · **Parent**: [Subsystems](AI-Runtime.md)
