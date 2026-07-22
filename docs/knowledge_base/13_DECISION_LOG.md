# AegisOS Knowledge Base: 13_DECISION_LOG.md

## Decision Register

### Decision 2026-07-23-01: Autonomic Self-Healing Daemon Architecture
* **Context**: Local inference runtimes (Ollama, LiteLLM, Gateway) occasionally encounter transient network socket drops or port collisions.
* **Decision**: Implement `AutonomicSelfHealingDaemon.ts` running as a background service probe with automatic non-destructive recovery and `hardenedEventBus` event emission (`AutonomicHealthReport`).
* **Rationale**: Eliminates manual developer intervention and keeps the workstation operating continuously.

### Decision 2026-07-23-02: Predictive VRAM Velocity Bursting
* **Context**: Static VRAM limits (e.g. 90%) failed to prevent OOM when rapid prompt context growth occurred within a single request.
* **Decision**: Implement rolling 60-second telemetry window velocity tracking ($\Delta VRAM / \Delta t$) in `CloudSpilloverRouter.ts`.
* **Rationale**: Enables pre-emptive redirection to cloud providers (Azure OpenAI / Anthropic) before memory ceilings are breached.

### Decision 2026-07-23-03: Zero-Touch SAML Group Claim Role Parsing
* **Context**: Enterprise single sign-on users required manual role seeds in local databases.
* **Decision**: Create `GroupClaimRoleMapper.ts` supporting regex and Distinguished Name (DN) parsing for SAML `memberOf` assertions.
* **Rationale**: Provides zero-touch enterprise identity onboarding out of the box.
