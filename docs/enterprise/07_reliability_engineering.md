# Reliability Engineering & Operations Framework

| Field | Value |
|---|---|
| **Document ID** | REF-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public / Operational Standard |
| **Owners** | Staff SRE / Site Reliability Lead |

---

## 1. SLOs, SLIs, & Availability Targets

We target **99.9% availability** for the Console management APIs and workflow execution schedule triggers.

| Service Component | Service Level Indicator (SLI) | Service Level Objective (SLO) | Target |
|---|---|---|---|
| **API Gateway (Caddy)** | HTTP Status Codes (`/api/v1/`) | % of responses returning non-5xx statuses over a 30-day window. | >= 99.9% |
| **Console Latency** | HTTP response duration | % of GET requests resolving in < 250ms over a 30-day window. | >= 95.0% |
| **Inference Latency** | Inference response duration | % of local LLM completions resolving in < 35s. | >= 99.0% |
| **Workflow Scheduler** | Event trigger delay | % of cron triggers firing within 15 seconds of target timestamp. | >= 99.5% |
| **Sync Engine** | Database synchronization | % of SQLite state sync events resolving in < 5 seconds. | >= 99.0% |

### Error Budget Policy
* **Error Budget Allocation**: 0.1% of API failures (approximately 43 minutes of downtime per 30 days).
* **Breach Enforcement**: If the error budget for a service is exhausted within a rolling 30-day window, feature deployments are suspended. Engineering resources are redirected entirely to reliability and bug fixing until the service recovers its budget.

---

## 2. Capacity Planning & Scaling Strategies

* **VRAM / GPU Capacity Planning**: Workstations running local models require dedicated GPU profiles:
  * Minimum: 1x NVIDIA RTX 4070 (12GB VRAM) for single small model runs (e.g., `smollm:135m`, `llama3:8b`).
  * Target: 1x NVIDIA RTX 5080 (16GB VRAM) or RTX 4090 (24GB VRAM) for active workflow agent orchestrations.
  * Enterprise: 2x NVIDIA RTX 5090 (32GB VRAM each) using NVLink/vLLM for simultaneous RAG, code, and agent tool execution runs.
* **Auto-Scaling Strategy (V2.0 Core)**:
  * Dynamic model unloading: Unload idle models from VRAM after 15 minutes of inactivity.
  * Cloud handoff: Redirect API calls to a centralized LiteLLM cloud gateway (e.g., GCP Vertex AI or Azure OpenAI) if local GPU queues exceed 5 concurrent runs.

---

## 3. Failure Modes and Effects Analysis (FMEA)

We identify system failures, their consequences, and automated remediation:

| Failure Scenario | Root Cause | Severity | Automated Remediation |
|---|---|---|---|
| **SQLite DB Corrupted** | Sudden power loss or disk write interruption. | **Critical** | On boot, the platform kernel validates SQLite integrity. If corrupted, it initiates restoration from the latest timestamped ZIP backup (`restore.bat`). |
| **Ollama Service Down** | Memory leak or CUDA driver crash. | **High** | `self-healer.ts` scans port `11434`. If failed, it triggers a warning alert log and restarts the Ollama service daemon. |
| **Event Bus Overflow** | A loop in workflow design generates thousands of events. | **Medium** | EventBus enforces a FIFO history buffer capped at 500 records, evicting old events. A rate limiter drops payloads exceeding 100 events/second. |
| **Tailscale Drop** | Local network loss or credential expiration. | **Medium** | Diagnostics detects endpoint ping failures, writes warning alerts, and logs routes to offline-cache mode. |

---

## 4. Disaster Recovery (DR) & Recovery Matrix

We define the Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets:

| Recovery Target | Backup Frequency | Storage Location | RTO Target | RPO Target | Restoration Command |
|---|---|---|---|---|---|
| **Database (SQLite)** | Every 6 hours (cron job) | Local backup dir / S3 bucket | < 10 mins | < 6 hours | `restore.bat` |
| **System Configs** | On change (version history) | Git repo / SQLite | < 5 mins | 0 (Git) | `git checkout` / DB rollback |
| **Inference Models** | On initial import | Local model registry | < 30 mins | 0 (Immutable) | `ollama pull [model-name]` |
| **Workflows & Code** | Continuous | Git VCS / GitHub | < 5 mins | 0 (Git) | `git clone [repo-url]` |

*Disaster Recovery validation testing must be run quarterly using the `DR_Validation.md` script.*

---

## 5. Monitoring & Alert Catalog

### 5.1 Alert Severity Matrix
* **Severity 1 (Critical)**: Platform offline, database inaccessible, or OAuth auth failure. Triggers immediate pager notifications to SRE Lead. Response SLA: 15 minutes.
* **Severity 2 (High)**: Local model offline, workflow engine scheduler suspended, or disk space > 90%. Triggers notifications on chat channels (Slack/Teams). Response SLA: 2 hours.
* **Severity 3 (Warning)**: Single user session timeout, memory buffer warning, or self-healer applying recovery. Logged in audit history. Review SLA: 24 hours.

### 5.2 Alert Catalog (Key Rules)
* **Rule AL-001 (Disk Space)**: Alert when disk space is > 85% for more than 5 minutes.
* **Rule AL-002 (Ollama Latency)**: Alert when Ollama ping response time is > 2 seconds.
* **Rule AL-003 (SAGA Failures)**: Alert when workflow execution fails on checkpoint resume.

---

## 6. Incident Management & Postmortem Template

Every Severity 1 or 2 incident requires a formal Postmortem within 24 hours of resolution:

### Postmortem Template
```markdown
# Incident Postmortem — [Incident Title] (e.g. INC-2026-004)

| Field | Value |
|---|---|
| **Incident ID** | INC-2026-XXX |
| **Severity** | [Critical | High] |
| **Date** | YYYY-MM-DD |
| **Owner** | [Name/Role] |

## 1. Summary
A brief description of what happened, customer impact (duration, percentage of users affected), and the final resolution.

## 2. Timeline (UTC)
* **HH:MM** - Incident starts.
* **HH:MM** - Automated alert fires.
* **HH:MM** - SRE acknowledges.
* **HH:MM** - Mitigation applied.
* **HH:MM** - Incident closed.

## 3. Root Cause Analysis (RCA)
Detailed 5-Whys analysis tracing the failure back to its source.

## 4. Remediation Items
* [ ] Action Item 1 (Owner, Due Date) - e.g. "Add validation schema to config endpoint."
* [ ] Action Item 2 (Owner, Due Date) - e.g. "Increase VRAM allocation trigger thresholds."
```
