# AegisOS Knowledge Base: 12_RISK_REGISTER.md

## Risk Log & Mitigation Strategies

| Risk ID | Domain | Risk Description | Severity | Likelihood | Mitigation Strategy | Status |
|---|---|---|---|---|---|---|
| **RSK-01** | Technical | High VRAM consumption velocity causing GPU Out-Of-Memory (OOM) crash during heavy agent loops. | High | Medium | `CloudSpilloverRouter` predictive VRAM velocity tracking ($\Delta VRAM / \Delta t$) triggers cloud bursting before memory limit saturation. | 🟢 Mitigated |
| **RSK-02** | Security | Malicious extension code attempting privilege escalation outside sandbox. | Critical | Low | Node `worker_threads` VM context sandboxing with strict CPU/memory limits and disabled system call bindings. | 🟢 Mitigated |
| **RSK-03** | Operational| Stale local service loopbacks causing API timeouts. | Medium | Low | `AutonomicSelfHealingDaemon` probes local endpoints every 15s and executes automatic recovery. | 🟢 Mitigated |
| **RSK-04** | Identity | Unmapped corporate IdP groups locking users out of RBAC roles. | High | Low | `GroupClaimRoleMapper` parses regex & DN assertions with zero-touch fallback to `User` role. | 🟢 Mitigated |
