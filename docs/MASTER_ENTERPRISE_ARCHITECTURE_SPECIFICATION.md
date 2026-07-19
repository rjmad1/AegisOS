# MASTER ENTERPRISE ARCHITECTURE SPECIFICATION

| Field | Value |
|---|---|
| **Document ID** | MEAS-2026-001 |
| **Version** | 1.0.0 (GA) |
| **Date** | 2026-07-18 |
| **Classification** | Restricted — Enterprise Architecture & Governance |
| **Owner** | Enterprise Architecture Board |
| **Status** | Approved |

---

## LEVEL 0: Executive Summary

### System Vision
To empower global enterprises to design, orchestrate, and govern autonomous AI-agent workflows on local workstations and sovereign clusters, securing absolute data privacy, compute sovereignty, and complete auditability without cloud vendor lock-in.

### Mission
To provide engineering and operations teams with a local-first, production-grade workstation control plane that coordinates hardware compute (GPUs/VRAM), local model routing proxies (Ollama/LiteLLM), context protocols (MCP), and background workflow orchestration.

### Problem Statement
Organizations operating in highly regulated domains (Finance, Healthcare, Defense) are blocked from utilizing public AI APIs due to security compliance policies (PII exposure, data leakage, lack of auditability). Direct integration with raw local model engines leads to unpredictable failures, memory constraints (VRAM leaks), resource starvation, lack of central observability, and unmanaged agent execution loops.

### Goals
1. **Zero Data Leaks**: Secure all user prompts, context chunks, and model weight distributions within the corporate workstation perimeter.
2. **High Platform Availability**: Establish a self-healing local runtime that recovers from port crashes, memory locks, and file corruption in < 5 seconds.
3. **Compute Efficiency**: Optimize GPU scheduling and swap idle model contexts to minimize VRAM footprints.

### Business Objectives
* **Reduce API Billing**: Transition 90% of repeatable developer tasks from public APIs to local models, aiming for a 75% cost reduction.
* **Guarantee Compliance**: Provide automated SOC2-ready audit reports verifying that zero PII leaves local machine perimeters.
* **Accelerate Onboarding**: Bootstrapping a local developer workstation environment with a single script in < 10 minutes.

### Strategic Themes
* **Compute Sovereignty**: Ownership and absolute control of weights, inputs, and orchestrations.
* **Resilient Infrastructure**: Autonomic control loop that monitors and auto-heals hardware and software services.
* **Frictionless Developer Experience**: Command-driven navigation, visual workflow design, and standard SDK bindings.

---

## LEVEL 1: Business Architecture

### Business Capability Model
AegisOS decomposes into three primary capability groups:
1. **Security & Governance**: Identity federation, RBAC enforcement, STRIDE inspection, and DB-backed audit logs.
2. **AI Runtime & Context**: Local model execution, proxy routing, token budget management, and Model Context Protocol (MCP) tool integration.
3. **Execution & Orchestration**: Workflow state machines, background worker queues, self-healing diagnostics, and visual dashboard interfaces.

### Capability Heatmap

```
┌─────────────────────────────────────────────────────────────┐
│                    AegisOS Capability Heatmap               │
├──────────────────────────────┬──────────────────────────────┤
│ 🟢 Security & Governance     │ 🟢 AI Runtime & Context      │
│  - User Auth & RBAC (High)   │  - Model Router (High)       │
│  - Prompt Filtering (High)   │  - VRAM Optimizer (Medium)   │
│  - Audit Logging (High)      │  - MCP Tool Sandbox (High)   │
├──────────────────────────────┴──────────────────────────────┤
│ 🟡 Execution & Orchestration                                │
│  - Workflow Coordinator (Medium)                           │
│  - Self-Healing Daemon (Medium)                            │
│  - Multi-node Clustering (Low - Target V2.0)                │
└─────────────────────────────────────────────────────────────┘
```

### Business Domains
* **Workstation Control Plane**: The local OS interface, service managers, and hardware monitor wrappers.
* **Model Operations (ModelOps)**: Version tracking, weight integrity validation, and runtime failover rules.
* **Audit & Compliance**: Central repository mapping prompts, evaluation scores, and file accesses.

### Business Functions
* **Ingress Management**: Authenticates users and routes developer requests to execution engines.
* **Context Gathering**: Queries databases and directories to assemble prompt contexts via Model Context Protocol.
* **Execution Validation**: Evaluates generated token outputs against correctness and security guardrails.

### Business Processes
1. **Onboarding Workstation**: Bootstrapping hardware dependencies, fetching model catalogs, and setting local configuration.
2. **Executing Workflow**: Triggering a multi-step task, checking steps, and writing status to persistent state.
3. **Remediating Failure**: Detecting port blockage or model freeze and restarting services without operator intervention.

### Value Streams
* **Developer to Productive (D2P)**: Rapid local AI bootstrap $\rightarrow$ Tool customization $\rightarrow$ Autonomous task automation.
* **SecOps Audit to Compliance (A2C)**: Request interception $\rightarrow$ Rule matching $\rightarrow$ Event logging $\rightarrow$ Audit verification.

### Business Services
* **Inference Dispatch Service**: Translates standard OpenAI payloads to local model engines.
* **Audit Trail Exporter**: Streams encrypted system events to corporate SIEM tools.

### Business Actors
* **Local Developer**: Builds workflows, edits prompts, and utilizes local model actions.
* **Compliance Auditor**: Reviews telemetry logs to verify data privacy compliance.
* **System Operator**: Maintains hardware assets, allocates GPU quotas, and manages software services.

### Stakeholders
* **Chief Information Security Officer (CISO)**: Demands zero data leaks and detailed audit streams.
* **VP of Software Engineering**: Demands high developer throughput and low operational overhead.
* **Chief Financial Officer (CFO)**: Requires low total cost of ownership (TCO) and predictable resource utilization.

### Personas
* **Sarah (DevSecOps Engineer)**: Responsible for security gates, access control, and auditing.
  * *Pain points*: Hardcoded configurations, shadow AI tools, and unmonitored prompt leakages.
* **Marcus (Principal AI Engineer)**: Responsible for prompt performance, agent design, and system latency.
  * *Pain points*: Model hallucinations, high network latency, and service crashes.

### RACI Matrix

| Task / Process | Local Developer | DevSecOps (Sarah) | AI Engineer (Marcus) | System Operator |
|---|---|---|---|---|
| Configure Security Policies | C | A | R | I |
| Bootstrap Workspace | A | I | R | C |
| Edit Prompt Templates | R | I | A | I |
| Remediate Service Failures | I | C | R | A |

### Business Rules
* **BR-SEC-01**: Under no circumstances shall user prompt context be transmitted to servers outside the enterprise boundary.
* **BR-RUN-02**: An agent execution step must be paused for human confirmation if a command execution tool is invoked.
* **BR-AUD-03**: All security policy violations must be written to the database within 10 milliseconds of detection.

### Business Constraints
* **Workstation Hardware**: The platform must execute within a local memory limit (e.g., minimum 16GB RAM, 8GB VRAM).
* **Network Isolation**: Execution must succeed on disconnected air-gapped systems.

### Business KPIs
* **MTTR**: Mean Time to Repair service crash $< 5.0$ seconds.
* **Compute Savings**: Reductions in cloud subscription costs (Target: $> 70\%$).
* **Audit Compliance Rating**: $100\%$ zero PII exfiltration events.

### Business Value Proposition
AegisOS eliminates unpredictable public API charges and cloud data breach liabilities by packing an enterprise-grade AI operations console directly onto local developer workstations.

### ROI Model
$$\text{Annual Return} = (\text{Cloud API Cost/Prompt} \times \text{Prompts/Year}) - (\text{Amortized GPU CapEx} + \text{Local OpEx})$$
*Average enterprise saves \$4,200 per developer per year by migrating code-generation workflows to local workstations.*

### Cost Model
* **CapEx**: High-performance workstations (GPUs, NVMe).
* **OpEx**: Local electrical power, maintenance engineers, and model catalog curation.

### Opportunity Analysis
Targeting sectors that are restricted from cloud LLM usage due to national regulations (Defense, Government, Swiss Banking).

### Competitive Differentiation
Unlike public cloud platforms (OpenAI, Anthropic) or simple local wrappers (Ollama Desktop), AegisOS features a hardened Control Plane, strict RBAC, automated self-healing, and event-driven digital twin state persistence.

---

## LEVEL 2: SIPOC Analysis

### System: Console (Next.js Admin Dashboard)
* **Supplier**: Local Developer / Admin Browser
* **Inputs**: User configurations, page requests, event triggers, session tokens
* **Process**: Compiles views, validates permissions, routes requests to local Gateway API, stores session state
* **Outputs**: Structured JSON payloads, interactive UI renders, configuration database writes
* **Customers**: Local Developer, System Operator, Audit Officers
* **Business Owner**: VP of Product
* **Technical Owner**: Frontend Lead Developer
* **Interfaces**: REST, WebSockets, Prisma ORM
* **SLAs**: UI load latency $< 1.5$ seconds, uptime $> 99.9\%$
* **Dependencies**: Node.js, Prisma, Tailwind CSS
* **Failure Modes**: Next.js process crash, React render failure, SQLite database lockup
* **Recovery**: Automated PM2 / Systemd process respawn, service wrapper restart

---

### System: AegisOS Gateway
* **Supplier**: Console Admin UI, Partner IDE extensions
* **Inputs**: REST requests, JSON-RPC messages, model execution templates
* **Process**: Enforces RBAC/JWT, validates inputs, coordinates workflow steps, proxies model calls to LiteLLM, executes local sandboxed tools
* **Outputs**: Event bus records, context-injected prompts, stdout streams
* **Customers**: Console application, Local Developer, Workflow Engine
* **Business Owner**: Director of Security
* **Technical Owner**: Backend Architect
* **Interfaces**: REST API (`:18789`), JSON-RPC over stdin/stdout, EventBus
* **SLAs**: API routing latency $< 25$ms, authentication validation $< 5$ms
* **Dependencies**: `jose` JWT library, Platform Kernel module registry
* **Failure Modes**: Thread lockup on tool execution, port conflict
* **Recovery**: Diagnostics self-healer kills hung processes and binds to fallback ports

---

### System: LiteLLM Router
* **Supplier**: AegisOS Gateway
* **Inputs**: OpenAI-compliant prompt structures, model aliases
* **Process**: Load balances queries, translates schemas, schedules fallbacks, tracks model queue latency
* **Outputs**: Text streams, JSON completions, latency logs
* **Customers**: AegisOS Gateway, AI application agents
* **Business Owner**: Infrastructure Manager
* **Technical Owner**: AI Infrastructure Engineer
* **Interfaces**: OpenAI API (`:4000`)
* **SLAs**: Routing overhead $< 10$ms, fallback execution $< 50$ms
* **Dependencies**: Python runtime, LiteLLM executable
* **Failure Modes**: Primary model endpoint timeout, GPU VRAM allocation failure
* **Recovery**: Route to secondary local models, flush VRAM caches via script

---

### System: Ollama Inference Engine
* **Supplier**: LiteLLM Router
* **Inputs**: Raw model weights, prompt tokens, generation parameters
* **Process**: Schedules tensor operations on CUDA, manages model context queues
* **Outputs**: Generated token streams, resource usage telemetry
* **Customers**: LiteLLM Router
* **Business Owner**: Hardware Operations
* **Technical Owner**: Systems Engineer
* **Interfaces**: Local Ollama HTTP API (`:11434`)
* **SLAs**: Token generation speed $> 30$ tokens/second (RTX 4090)
* **Dependencies**: NVIDIA GPU driver, CUDA toolkit, local weight repository
* **Failure Modes**: CUDA Out-Of-Memory (OOM), weight file corruption
* **Recovery**: Auto-kill task, reload model weights, trigger model defragmentation loop

---

### System: Relational Persistence (PostgreSQL / SQLite)
* **Supplier**: AegisOS Gateway, Console app
* **Inputs**: SQL queries, transaction operations, schema updates
* **Process**: Writes relational tables, serializes transactions, enforces unique constraints
* **Outputs**: Query rows, commit confirmations
* **Customers**: Platform Kernel, Audit Logger
* **Business Owner**: CISO / Data Governance Officer
* **Technical Owner**: Lead Database Administrator
* **Interfaces**: PostgreSQL Port (`:5432`), Prisma Client
* **SLAs**: Transaction latency $< 5$ms
* **Dependencies**: Local NVMe storage, filesystem write permissions
* **Failure Modes**: Write lock conflict, storage volume fullness
* **Recovery**: Automated rollback of uncommitted transaction, run autovacuum, execute auto-restore from backup

---

### System: Cache Service (Redis)
* **Supplier**: AegisOS Gateway, Background worker
* **Inputs**: Key-value data, job queues, lock requests
* **Process**: Keeps fast session maps in memory, manages task queues
* **Outputs**: Cached strings, popped job tasks
* **Customers**: Background Workflow Worker
* **Business Owner**: Infrastructure Manager
* **Technical Owner**: Backend Engineer
* **Interfaces**: Redis Protocol Port (`:6379`)
* **SLAs**: Fetch latency $< 2$ms
* **Dependencies**: Host memory limits
* **Failure Modes**: Out of memory, persistence write failure
* **Recovery**: Redis container restart, fallback to local in-memory store

---

### System: Object Storage (MinIO)
* **Supplier**: AegisOS Gateway, Console app
* **Inputs**: Binary files, model weights, workspace archives
* **Process**: Stores unstructured files in bucket systems
* **Outputs**: File streams, presigned URLs
* **Customers**: RAG embedding pipeline, Model Ops Manager
* **Business Owner**: Infrastructure Manager
* **Technical Owner**: SRE Lead
* **Interfaces**: S3 API (`:9000`)
* **SLAs**: File fetch latency $< 15$ms
* **Dependencies**: File system storage
* **Failure Modes**: Bucket read limit reached, partition full
* **Recovery**: Storage partition resize, volume mounting repair

---

### System: Metrics Collector (Prometheus)
* **Supplier**: AegisOS Gateway, Ollama, Redis, PostgreSQL
* **Inputs**: Metrics scrape configurations, HTTP pull requests
* **Process**: Aggregates time-series data, evaluates alerting rules
* **Outputs**: Scraped logs, active alert triggers
* **Customers**: Grafana, SRE Alerting channels
* **Business Owner**: SRE Lead
* **Technical Owner**: Monitoring Engineer
* **Interfaces**: Prometheus UI (`:9090`)
* **SLAs**: Scrape interval accuracy within 100ms
* **Dependencies**: Network access to service metrics endpoints
* **Failure Modes**: Storage directory corruption, high CPU usage
* **Recovery**: Truncate old data partitions, auto-restart container

---

### System: Observability UI (Grafana)
* **Supplier**: Prometheus, Jaeger
* **Inputs**: Time-series metrics data, trace spans
* **Process**: Renders performance charts, displays active service status
* **Outputs**: Visual dashboards, PDF scorecard exports
* **Customers**: System Operator, Executives
* **Business Owner**: VP of Operations
* **Technical Owner**: Frontend Operations Engineer
* **Interfaces**: Grafana UI (`:3001`)
* **SLAs**: Dashboard render $< 3$ seconds
* **Dependencies**: Prometheus datasource connection
* **Failure Modes**: Datasource disconnect, process crash
* **Recovery**: Re-establish endpoint connection, container restart

---

### System: Distributed Tracing (Jaeger)
* **Supplier**: AegisOS Gateway, LiteLLM
* **Inputs**: Structured span payloads, trace context headers
* **Process**: Correlates trace IDs, maps request paths
* **Outputs**: Dependency graphs, waterfall trace maps
* **Customers**: Lead Architect, Developers
* **Business Owner**: VP of Engineering
* **Technical Owner**: Backend Tech Lead
* **Interfaces**: Jaeger UI Port (`:16686`)
* **SLAs**: Collector processing latency $< 10$ms
* **Dependencies**: ElasticSearch/Local database persistence
* **Failure Modes**: Collector memory buffer overflow
* **Recovery**: Increase collection batch size, flush buffer limits

---

## LEVEL 3: User Analysis

### Persona Breakdown & User Workflows

```
┌────────────────────────────────────────────────────────────────────────┐
│                        User Journey & Operations                       │
├────────────────────────────────────────────────────────────────────────┤
│  Sarah (DevSecOps)                                                     │
│   - Objective: Prevent data leakage, verify imported model hashes.     │
│   - Pain Points: Hardcoded secrets, unmonitored scripts.               │
│   - Capabilities Used: Audit Logs Screen, Security Policy Manager.     │
│   - Journey: Inspect Alert -> Trace prompt -> Block tool.             │
│                                                                        │
│  Marcus (AI Engineer)                                                  │
│   - Objective: Build and test multi-agent workflow chains.             │
│   - Pain Points: CPU/GPU bottlenecks, high latency.                    │
│   - Capabilities Used: Workflow Designer, Command Palette.             │
│   - Journey: Write prompt -> Test on Ollama -> Build execution cron.   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Executives
* **Objectives**: Audit compute ROI, verify compliance ratings.
* **Pain Points**: Lack of visibility into AI spend and data risks.
* **Responsibilities**: Approving budget plans and compliance scorecards.
* **Capabilities Used**: Executive Scorecard, ROI Dashboard.
* **Journey**: Log into Console -> Check Monthly Savings charts -> Export PDF.
* **Primary Screens**: Executive Dashboard.
* **Typical Workflows**: Quarterly review of operational cost savings.
* **Frequency**: Monthly / Quarterly.

#### Developers
* **Objectives**: Integrate AI tasks into codebases, run local code assistants.
* **Pain Points**: Heavy local setup, model response lag.
* **Responsibilities**: Code generation and extension development.
* **Capabilities Used**: Developer Console, SDKs, CLI.
* **Journey**: Start local daemon -> Call SDK from editor -> Debug prompts.
* **Primary Screens**: Developer Console, Logs Viewer.
* **Typical Workflows**: Query local model for code completion.
* **Frequency**: Hourly.

#### DevOps
* **Objectives**: Keep system operational, automate deployment pipelines.
* **Pain Points**: Port conflicts, CUDA configuration mismatches.
* **Responsibilities**: Orchestrating containers and managing server daemons.
* **Capabilities Used**: Deployment Guide, CLI tools, backups.
* **Journey**: Run bootstrap -> Verify health metrics -> Configure Tailscale.
* **Primary Screens**: Port Monitoring Screen, Operations Console.
* **Typical Workflows**: Standard deployment verification checklist.
* **Frequency**: Daily.

#### Platform Engineers
* **Objectives**: Maintain host stability, configure sandbox bounds.
* **Pain Points**: Unpredictable model sizes overloading workspace directories.
* **Responsibilities**: Managing storage volumes and registry catalogs.
* **Capabilities Used**: Platform Asset Catalog, Extension Manager.
* **Journey**: Review plugin requests -> Set folder constraints -> Enforce limits.
* **Primary Screens**: Asset Catalog Manager.
* **Typical Workflows**: Adding a new custom MCP plugin to the registry.
* **Frequency**: Weekly.

#### AI Engineers
* **Objectives**: Fine-tune prompts, optimize routing rules, select models.
* **Pain Points**: GPU memory bottlenecks, poor model output quality.
* **Responsibilities**: Editing model manifests, prompt engineering.
* **Capabilities Used**: LiteLLM Proxy routing, Model Manifest, Evaluation.
* **Journey**: Pull GGUF model -> Configure routing fallback -> Run evaluations.
* **Primary Screens**: Model Routing and Evaluation Dashboard.
* **Typical Workflows**: Swap model routing due to high latency.
* **Frequency**: Daily.

#### Architects
* **Objectives**: Ensure decoupled code layers, maintain modular design.
* **Pain Points**: Multi-node scaling logic complexity, circular imports.
* **Responsibilities**: Writing ADRs and validating code compliance.
* **Capabilities Used**: Architecture Fitness Report, ADR Index.
* **Journey**: Define system boundaries -> Run validation scripts -> Approve PRs.
* **Primary Screens**: Architecture Dashboard.
* **Typical Workflows**: Creating a new architectural decision record.
* **Frequency**: Weekly.

#### Business Analysts
* **Objectives**: Create workflow templates to automate office processes.
* **Pain Points**: Complex code syntax in templates.
* **Responsibilities**: Designing business logic steps.
* **Capabilities Used**: Visual Workflow Designer.
* **Journey**: Drag and drop workflow nodes -> Link to models -> Validate outputs.
* **Primary Screens**: Workflow Designer UI.
* **Typical Workflows**: Automating incoming email support routing.
* **Frequency**: Weekly.

#### Product Managers
* **Objectives**: Align features with market opportunities, plan releases.
* **Pain Points**: Disconnected requirements and development status.
* **Responsibilities**: Managing roadmap objectives and backlog priorities.
* **Capabilities Used**: Traceability Matrix, PRD.
* **Journey**: Review gap matrix -> Update roadmap tickets -> Monitor releases.
* **Primary Screens**: Product Management Strategy Screen.
* **Typical Workflows**: Updating the three-year product roadmap.
* **Frequency**: Monthly.

#### Operations
* **Objectives**: Run server tasks, monitor system capacity.
* **Pain Points**: Silent database locks, background worker halts.
* **Responsibilities**: Performing database backups, rotating logs.
* **Capabilities Used**: Backups Script, Logs Rotation Runbook.
* **Journey**: Inspect storage levels -> Run cleanup scripts -> Verify backups.
* **Primary Screens**: Operations Dashboard.
* **Typical Workflows**: Daily backup verification routine.
* **Frequency**: Daily.

#### Security
* **Objectives**: Verify zero PII leakage, enforce network trust.
* **Pain Points**: Shadow LLM endpoints, raw execution files on disk.
* **Responsibilities**: Configuring OAuth, auditing trust boundaries.
* **Capabilities Used**: Threat Model, Security Governance Framework.
* **Journey**: Audit logs analysis -> Inject test exploits -> Update RBAC rules.
* **Primary Screens**: Security Dashboard.
* **Typical Workflows**: Standard security audit compliance checks.
* **Frequency**: Daily.

#### Support
* **Objectives**: Troubleshoot developer installation issues.
* **Pain Points**: Windows OS differences (WSL vs Native), GPU driver versions.
* **Responsibilities**: Diagnosing customer bug reports.
* **Capabilities Used**: Troubleshooting Guide, Diagnostics Monitor.
* **Journey**: Search issue on registry -> Check local logs -> Propose fix.
* **Primary Screens**: Troubleshooting Console.
* **Typical Workflows**: Standard support ticket diagnostic sequence.
* **Frequency**: Daily.

#### End Users
* **Objectives**: Query AI for document answers, run simple chat steps.
* **Pain Points**: Blank dashboard screens, slow response times.
* **Responsibilities**: Writing prompt inputs.
* **Capabilities Used**: Chat UI Console.
* **Journey**: Open Browser -> Write prompt -> Check output.
* **Primary Screens**: Chat UI.
* **Typical Workflows**: Conversational chat assistant tasks.
* **Frequency**: Daily.

#### Power Users
* **Objectives**: Query command palette using fuzzy search, execute tasks.
* **Pain Points**: Click-heavy administration settings screens.
* **Responsibilities**: Setting custom shortcuts and using CLI shortcuts.
* **Capabilities Used**: Unified Command Palette, SDK scripts.
* **Journey**: Open Command Palette -> Type search -> Select action.
* **Primary Screens**: Console.
* **Typical Workflows**: Executing system configuration changes.
* **Frequency**: Daily.

#### Administrators
* **Objectives**: Manage system scopes, control user permissions.
* **Pain Points**: Enforcing key rotation schedules, handling environment drift.
* **Responsibilities**: Allocating user permissions and roles.
* **Capabilities Used**: Administrator Guide, Secrets Vault.
* **Journey**: Onboard user -> Assign RBAC scope -> Generate key.
* **Primary Screens**: User Configuration tab.
* **Typical Workflows**: Initial workstation onboarding.
* **Frequency**: Weekly.

#### Auditors
* **Objectives**: Verify compliance trails, audit PII leaks.
* **Pain Points**: Handling massive unstructured log volumes.
* **Responsibilities**: Compiling security assessment reports.
* **Capabilities Used**: Audit Event Store, Policy Enforcer.
* **Journey**: Run audit filter -> Validate trace signature -> Sign report.
* **Primary Screens**: Audit Event Log.
* **Typical Workflows**: Monthly compliance review.
* **Frequency**: Monthly.

#### Researchers
* **Objectives**: Evaluate local model capabilities, test custom weights.
* **Pain Points**: Restricted model settings on standard local daemons.
* **Responsibilities**: Testing model performance capabilities.
* **Capabilities Used**: Python SDK, LiteLLM benchmarks.
* **Journey**: Run Jupyter notebook -> Queue prompt batches -> Output chart.
* **Primary Screens**: Diagnostics Dashboard.
* **Typical Workflows**: Custom GGUF benchmark tests.
* **Frequency**: Weekly.

---

## LEVEL 4: Capability Matrix

| Capability ID | Description | Owner | Business Value | Priority | Dependencies | Consumers | Providers | Required Permissions | Maturity | Criticality |
|---|---|---|---|---|---|---|---|---|---|---|
| **CAP-01** | User Auth & Session | DevSecOps Lead | Secures access to console APIs | Critical | Database, JWT key | All Web/Mobile clients | Ingress Layer | `read_user`, `write_session` | 4 (Advanced) | High |
| **CAP-02** | Workflow Orchestration | Backend Architect | Automates developer task loops | High | Database, Redis | Agents, Jobs console | Workflow Engine | `run_workflow` | 3 (Managed) | Medium |
| **CAP-03** | Self-Healing Diagnostics | SRE Lead | Minimizes workstation downtime | High | Host OS, Service scripts | System Operator | Platform Diagnostics | `sys_restart_service` | 3 (Managed) | High |
| **CAP-04** | Command Palette Search | Frontend Lead | Reduces cognitive load | Medium | SearchEngine index | Local Developer | UI Console | `read_registry` | 4 (Advanced) | Low |
| **CAP-05** | Secrets Encryption Vault | DevSecOps Lead | Securely persists keys and tokens | Critical | DPAPI, host OS | Platform Services | SecretRepository | `decrypt_vault` | 4 (Advanced) | High |
| **CAP-06** | Model Routing Proxy | AI Architect | Automatically handles failovers | Critical | LiteLLM, Ollama | AI Agents | LiteLLM Router | `dispatch_query` | 4 (Advanced) | High |
| **CAP-07** | RAG Vector Search | AI Architect | Injects local context | High | Postgres, MinIO | Context Layer | RAG Engine | `query_vector` | 2 (Basic) | Medium |

---

## LEVEL 5: Enterprise System Map

### System Boundaries and Composition Hierarchy

* **AegisOS Platform System** (workstation perimeter)
  * **Next.js Console Subsystem** (Port 3000)
    * `src/app/` (React Routes & API endpoints)
    * `src/components/` (UI elements, command palette)
    * `src/store/` (Zustand state store)
  * **Aegis Core Runtime Subsystem** (Port 18789)
    * `src/platform/kernel/PlatformKernel.ts` (Platform boot & module injection)
    * `src/platform/module-registry/` (Registration catalog)
    * `src/platform/permissions/PermissionService.ts` (RBAC engine)
    * `src/services/self-healer.ts` (Diagnostics loops)
  * **Model Proxy Gateway Subsystem** (Port 4000)
    * LiteLLM Python process (Routing backend)
    * Model Routing Tables (`configs/litellm_config.yaml`)
  * **Inference Engine Subsystem** (Port 11434)
    * Ollama Windows Daemon (Weights runtime)
    * GPU CUDA Toolkit (Matrix math acceleration)
  * **Persistence & Cache Subsystem**
    * PostgreSQL / SQLite (`databases/dev.db` / Port 5432)
    * Redis Queue Manager (Port 6379)
    * MinIO Object Store (Port 9000)
  * **Observability Subsystem**
    * Prometheus metrics database (Port 9090)
    * Grafana Dashboard console (Port 3001)
    * Jaeger distributed tracing collector (Port 16686)

### Ownership and Relationships
* **Inference & Proxy** is owned by the **AI Infrastructure Team**.
* **Console UI & Core Kernel** is owned by the **Developer Platform Team**.
* **Databases & Backups** are owned by the **System Operations Team**.
* **Security Middleware & Auditing** are owned by the **DevSecOps Team**.

---

## LEVEL 6: Component Catalog

### 1. PlatformKernel (`src/platform/kernel/PlatformKernel.ts`)
* **Purpose**: Orchestrates initialization, dependency injection, and recovery of AegisOS core modules.
* **Responsibilities**: Parses module inputs, starts services, runs self-healing checks on boot failures.
* **Inputs**: Array of `PlatformModule` objects.
* **Outputs**: Initialized service map, health scorecard payload.
* **Dependencies**: `ModuleRegistry`, `ServiceRegistry`, `PlatformDiagnostics`, `ConfigurationPlatform`.
* **Interfaces**: TypeScript Class Instance (`PlatformKernel`).
* **Ports**: N/A (In-memory library).
* **Protocols**: Local memory call.
* **Authentication**: Bound to local process owner scope.
* **Configuration**: Database-backed Config models.
* **Secrets**: None.
* **Environment Variables**: `NODE_ENV`.
* **Storage**: In-memory module maps.
* **Logging**: Winston logger.
* **Metrics**: `platform.boot.time_ms`, `platform.active_modules.count`.
* **Health Checks**: Checks initialization phase ('bootstrapping' $\rightarrow$ 'running').
* **Recovery**: Re-runs bootstrap with exponential backoff on errors.
* **Failure Modes**: Circular dependency blocks, module init timeout.
* **Performance**: Boot execution overhead $< 150$ms.
* **Security**: Sandbox verified code only.
* **Lifecycle**: Managed by node runner.
* **Documentation**: `docs/Platform_Handbook.md`.

---

### 2. SelfHealer (`src/services/self-healer.ts`)
* **Purpose**: Automatically remediates local environment and port lock failures.
* **Responsibilities**: Polls ports, checks folder paths, restarts hung services.
* **Inputs**: Telemetry logs, port scans.
* **Outputs**: Restart commands, service status events.
* **Dependencies**: `platformDiagnostics`, shell executors.
* **Interfaces**: Diagnostic interface, event emitter.
* **Ports**: N/A (runs shell commands).
* **Protocols**: OS command execution.
* **Authentication**: Requires elevated local admin shell permissions.
* **Configuration**: `self_heal_rules.json`.
* **Secrets**: Encrypted service account credentials (if using non-admin accounts).
* **Environment Variables**: `OPS_AUTO_HEAL=true`.
* **Storage**: Diagnostic state written to database.
* **Logging**: File-based security logs.
* **Metrics**: `self_healer.remediations.count`, `self_healer.failures_remediated`.
* **Health Checks**: Standard ping test.
* **Recovery**: Executes OS commands to kill locked processes.
* **Failure Modes**: Infinite remediation loop on unfixable port locks.
* **Performance**: Diagnosis interval every 5000ms, execution time $< 2.0$s.
* **Security**: Command validation library protects against injection.
* **Lifecycle**: Boots at phase 'running'.
* **Documentation**: `docs/Troubleshooting_Guide.md`.

---

## LEVEL 7: Data Architecture

### Logical Data Model
```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER {
        string id PK
        string email UK
        string role
        string status
    }
    SESSION {
        string id PK
        string userId FK
        datetime createdAt
        datetime lastActive
    }
    PLATFORM_COMPONENT ||--o{ AUDIT_EVENT : triggers
    PLATFORM_COMPONENT {
        string id PK
        string name
        string category
        string status
        string lifecycleState
        int port
    }
    WORKFLOW_EXECUTION ||--|{ WORKFLOW_STEP : executes
    WORKFLOW_EXECUTION {
        string id PK
        string workflowName
        string status
        datetime createdAt
    }
    WORKFLOW_STEP {
        string id PK
        string executionId FK
        string name
        string status
        string error
    }
    AUDIT_EVENT {
        int id PK
        string timestamp
        string eventType
        string userId FK
        string details
    }
```

### Physical Data Model
* **Database Provider**: PostgreSQL (migrating from local SQLite dev DB).
* **Connection Pooling**: Prisma client pool size set to 15 connections.
* **Storage Path**: Host file `/databases/dev.db` (SQLite) / PostgreSQL data volume partition.

### Vector Stores & Embedding Pipelines
* **Vector Engine**: `pgvector` extension in PostgreSQL / local Faiss files.
* **Embedding Model**: `all-minilm:latest` (running on local Ollama).
* **Dimensions**: 384 dimensions.
* **Chunking Strategy**: Recursive text splitting with 500-token chunks and 10% overlap.
* **Index**: HNSW index for cosine distance searching.

### Retention & Governance
* **Audit Events**: Retained for 1 year in read-only partitions, then archived to backup storage.
* **Chat Sessions**: Retained for 90 days. User can manually delete session database rows.
* **GDPR/HIPAA Compliance**: System provides tools to erase individual user ID records and scrub logs.

---

## LEVEL 8: Data Flow Analysis

### Request-Response & Inference Flows

```mermaid
sequenceDiagram
    autonumber
    participant UI as Browser UI
    participant GW as AegisOS Gateway
    participant LT as LiteLLM Router
    participant OL as Ollama Engine
    participant DB as SQLite / Postgres
    
    UI->>GW: HTTP POST: Ask AI (User Prompt)
    activate GW
    GW->>DB: Read user role and session parameters
    DB-->>GW: Role: Developer
    GW->>GW: Enforce prompt policy checks
    GW->>LT: Forward Prompt (OpenAI compatible)
    activate LT
    LT->>LT: Determine load balancing and target model
    LT->>OL: POST /api/generate
    activate OL
    OL-->>LT: Text token chunk stream
    deactivate OL
    LT-->>GW: Structured completion payload
    deactivate LT
    GW->>DB: Log execution step & token count
    GW-->>UI: Renders response text
    deactivate GW
```

### End-to-End Flow Descriptions
1. **Control Flow**: Control commands are initiated in the Next.js UI console, routed through the `PlatformKernel`, and executed via native OS service wrappers.
2. **Embedding Flow**: Document files $\rightarrow$ Text parsed $\rightarrow$ Chunked $\rightarrow$ Ollama `/api/embeddings` $\rightarrow$ Vector float arrays $\rightarrow$ Saved to Postgres `pgvector` store.
3. **Backup Flow**: `backup.bat` runs $\rightarrow$ Postgres `pg_dump` writes data $\rightarrow$ MinIO objects copied $\rightarrow$ Target `.zip` file stored on local backup drive.
4. **Recovery Flow**: Port crash $\rightarrow$ `self-healer` triggers `Get-NetTCPConnection` $\rightarrow$ Finds PID $\rightarrow$ Runs `Stop-Process` $\rightarrow$ Restarts service.

---

## LEVEL 9: AI Architecture

### Model Routing Specifications
* **Primary Reasoning Model**: `deepseek-r1:32b` (Used for code reviews and structural planning).
* **Primary Chat/Tool Model**: `gemma4:latest` (Used for standard workflows and conversational tasks).
* **Intent Routing Engine**: `smollm:135m` (Routes queries based on semantic classifications).
* **Embedding Model**: `all-minilm:latest` (Generates document search dimensions).

### Prompts & Reasoning Chains
* **Prompt Versioning**: Managed via static JSON manifests in `configs/prompts/`.
* **System Prompt Isolation**: Every model execution injects a system prompt instructing the model to reject queries that attempt to read files outside the workspace directory.
* **Reasoning Chain Control**: Models are guided via few-shot COT (Chain of Thought) templates to output steps inside XML tags (`<thought>...</thought>`).

### Model Context Protocol (MCP) Integration
* AegisOS runs an MCP Host Engine that spawns sandboxed tool processes.
* Communication protocols use standard JSON-RPC over stdin/stdout.
* **Active MCP Tools**:
  * `read_file`: Fetches content of absolute workspace paths.
  * `write_file`: Modifies source files (restricted to `src/` and `docs/`).
  * `run_command`: Proposes OS terminal commands (requires human operator confirmation).

### Safety & Guardrails
* **Policy Enforcer**: Matches incoming prompts against Regex blacklists (e.g., matching system commands like `rm -rf`).
* **Evaluation Engine**: Scores model output accuracy, completeness, and grounding. A score $< 0.8$ triggers fallback routing to secondary models.

---

## LEVEL 10: Operational Architecture

### Deployment Topologies
AegisOS is deployed as a local workstation control plane. Services are managed using Docker Compose or native OS system wrappers.

```
┌─────────────────────────────────────────────────────────────┐
│                 Workstation Local Topology                  │
├─────────────────────────────────────────────────────────────┤
│   [Caddy Ingress Reverse Proxy] (HTTPS :443 / HTTP :80)     │
│             │                                               │
│             ├─► Console (Next.js :3000)                     │
│             └─► Gateway API (Node.js :18789)                │
│                   │                                         │
│                   ├─► LiteLLM Proxy (:4000)                 │
│                   │     └─► Ollama Engine (:11434)          │
│                   ├─► PostgreSQL Database (:5432)           │
│                   └─► Redis Queue manager (:6379)           │
└─────────────────────────────────────────────────────────────┘
```

### Observability & Telemetry Standard
* **Metrics Scrape**: Prometheus pulls metrics from `/api/v1/metrics` every 10 seconds.
* **Trace Exporter**: OpenTelemetry collector runs inside the gateway, exporting trace events to Jaeger via OTLP/gRPC.
* **RED Taxonomy**:
  * **Rate**: Request throughput count per second.
  * **Errors**: Count of 5xx HTTP responses and DB write aborts.
  * **Duration**: Total API response latency waterfall.
* **Alerting Metrics**:
  * `ollama.vram.usage_percent > 95%` $\rightarrow$ Warning alert.
  * `gateway.ports.blocked > 0` $\rightarrow$ Critical auto-heal trigger.

---

## LEVEL 11: Security Architecture

### Zero-Trust & Identity Controls
* **Authentication**: Decoupled JWT backend. Session keys are signed using a local private key generated during first-time bootstrapping.
* **Authorization**: Role-Based Access Control (RBAC) maps user roles to specific endpoint permissions:
  * **Administrator**: Full system privileges, edit configuration, add plugins.
  * **Developer**: Create workflows, read logs, write workspace files.
  * **Operator**: Read metrics, execute backups, restart services.
  * **Reviewer**: Read-only access to audit logs and trace scorecards.

### Cryptographic Protections
* **Secrets Vault**: Config keys, API tokens, and DB passwords are encrypted at rest using AES-256-GCM.
* **Key Encryption Key (KEK)**: Wrapped via the Windows Data Protection API (DPAPI) on local machines.
* **mTLS (Target V2.0)**: Cluster nodes will use mutual TLS certificates for service-to-service communication.

### STRIDE Threat Modeling

| Threat Category | Potential Risk | Mitigation |
|---|---|---|
| **Spoofing** | Unauthorized API client sends mock gateway commands | Force all requests through JWT token signature verification |
| **Tampering** | User edits SQLite database file on disk | Enforce database file system restrictions (system read-only to app user) |
| **Repudiation** | Operator runs destructive command and denies it | Write all commands to cryptographically signed Audit logs |
| **Information Disclosure** | Model prompt logs leak corporate data | Scrape logs for PII, encrypt database volume partitions |
| **Denial of Service** | LLM inference requests crash workstation memory | Implement token rate limiters, route queues through Redis |
| **Elevation of Privilege** | Plugin execution gains shell permissions | Run plugins in restricted NodeVM containers, restrict paths |

---

## LEVEL 12: Deployment Architecture

### Lifecycle Topologies & Environments
* **Development**: Executed on local workstations using WSL2, SQLite, and mock API endpoints.
* **Testing**: Automated Playwright and Vitest runners execute in GitHub Actions runners.
* **Staging**: Docker Compose environments simulating multi-service configurations.
* **Production**: Local workstation metal installations wrapping Ollama, PostgreSQL, and Next.js binaries behind system utilities (NSSM, Caddy).

### Service Startup & Shutdown Sequence

```mermaid
graph TD
    subgraph Startup Sequence
        S1[Boot OS/Docker] --> S2[Start DB Postgres / SQLite]
        S2 --> S3[Start Redis Cache]
        S3 --> S4[Start MinIO Storage]
        S4 --> S5[Start Ollama Inference Engine]
        S5 --> S6[Start LiteLLM Router]
        S6 --> S7[Start AegisOS Gateway & Console]
    end
    
    subgraph Shutdown Sequence
        P1[Stop Console & Ingress] --> P2[Drain Active Worker Queues]
        P2 --> P3[Stop LiteLLM & Ollama]
        P3 --> P4[Stop Cache & Database]
        P4 --> P5[Unmount Filesystem Volumes]
    end
```

### Health Check Gating
A service is flagged as `online` only when:
1. `GET /api/v1/health` returns status code `200`.
2. PostgreSQL database connection is verified via Prisma `db.$queryRaw`.
3. LiteLLM proxy port `:4000` responds to standard ping tests.

---

## LEVEL 13: Lifecycle Management

### Installation Guide
1. Run PowerShell as Administrator.
2. Clone repository: `git clone rjmad1/AegisOS`.
3. Execute bootstrap: `.\Bootstrap.ps1`.
4. Wait for Node.js download, CUDA check, database migrations, and model pull.

### Backup Strategy
* **Database Backup**: Runs pg_dump to write data to SQL files.
* **Object Store Backup**: Uses MinIO client (`mc mirror`) to duplicate buckets to backup directories.
* **Execution**: Scheduled daily via Windows Task Scheduler.

### Disaster Recovery Runbook

```
┌─────────────────────────────────────────────────────────────┐
│                 Disaster Recovery Workflow                  │
├─────────────────────────────────────────────────────────────┤
│  [System Fail] ──► Kill locked PIDs (self-healer)           │
│                         │                                   │
│                         ├─► Port recovery succeeds? (Resume)│
│                         └─► Fail? Read recovery checkpoint  │
│                               │                             │
│                               ▼                             │
│                         [Restore DB from backup.sql]        │
│                               │                             │
│                               ▼                             │
│                         [Rebuild container volumes]         │
│                               │                             │
│                               ▼                             │
│                         [Restart local runners]             │
└─────────────────────────────────────────────────────────────┘
```

---

## LEVEL 14: Traceability Matrix

### Bidirectional Project Mappings

```
Business Goal: Secure local execution bounds
 └── Capability: CAP-05 Secrets Encryption Vault
      └── Feature: FR-005 Secrets Vault CRUD
           └── Component: src/repositories/secret.repository.ts
                └── Service: aesGcmEncrypt() / aesGcmDecrypt()
                     └── API endpoint: /api/v1/admin/secrets
                          └── Data Store: PlatformConfig Table (Prisma)
                               └── Verification Test: src/repositories/secret.test.ts
                                    └── Documentation: docs/SECRETS_MANAGEMENT.md
                                         └── Monitor: Alert: DPAPI Key Resolution Failed
```

*For details on all primary project mappings, see the master [Bidirectional Traceability Matrix](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/enterprise/11_traceability_matrix.md).*

---

## LEVEL 15: Architecture Decision Records

### ADR Consolidation Summary

* **ADR-001: Contract-First Versioned API Boundaries**
  * *Context*: External API calls lacked validation schemas, risking runtime exceptions on data shifts.
  * *Decision*: Restrict client communications to structured, versioned REST endpoints (`/api/v1/`).
  * *Tradeoffs*: Requires writing extra API endpoints, increases development overhead.
* **ADR-002: Server-Side Decoupled Authentication**
  * *Context*: Frontend clients held raw authentication tokens, exposing keys to session hijack threats.
  * *Decision*: Use server-side signed JWTs wrapped in HttpOnly cookies.
  * *Tradeoffs*: Restricts client access to cookie payloads, requires custom API proxy logic.
* **ADR-003: Unified Event-Driven Registry**
  * *Context*: Frontend widgets updated states via polling, causing high CPU load.
  * *Decision*: Implement client-side EventBus aligned with backend service events.
  * *Tradeoffs*: Introduces state synchronization issues if network drops occur.
* **ADR-004: Pipeline Worker Processing Architecture**
  * *Context*: Long-running model calls blocked Next.js server threads, causing API timeouts.
  * *Decision*: Offload tasks to background worker processes managed via Saga DB checkpoints.
  * *Tradeoffs*: Adds Redis and queue worker components to infrastructure.
* **ADR-009: Autonomic Operating System Architecture**
  * *Context*: Direct client-to-inference coupling makes self-healing difficult.
  * *Decision*: Introduce a 7-layered dependency stack separating the Control Plane (Layer 5) from the Execution Layer (Layer 2).
  * *Tradeoffs*: Higher component footprint, complex initialization sequences.

---

## LEVEL 16: Documentation Inventory

| Document ID | File Path | Purpose | Owner | Version | Current Status |
|---|---|---|---|---|---|
| **APGP-2026** | [Platform Governance Package](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/governance/Platform_Governance_Package.md) | Details baseline contracts, schemas, and metrics | SRE Lead | 1.0.0 | Canonical |
| **EGM-2026** | [Enterprise Gap Matrix](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/enterprise/01_enterprise_gap_matrix.md) | Analyzes platform maturity gap priorities | Architects Panel | 1.0.0 | Canonical |
| **PME-2026** | [Product Strategy](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/enterprise/02_product_management.md) | Product vision, TAM, and personas | CPO | 1.0.0 | Canonical |
| **PAS-2026** | [Product Architecture Spec](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/productization/02_product_architecture_specification.md) | Component boundary specifications | Lead Architect | 1.0.0 | Canonical |
| **BTM-2026** | [Traceability Matrix](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/enterprise/11_traceability_matrix.md) | Maps objectives to code and tests | TPM | 1.0.0 | Canonical |

---

## LEVEL 17: Gap Analysis

### 1. Missing Components
* **mTLS Node Cluster Coordination**: Workstations run as single local instances; lacks cluster synchronization.
* **Isolation Sandbox for MCP Tools**: Executed tools run in host process context, raising security concerns.
* **Server-Sent Events (SSE) Push**: UI components poll the database for updates; needs SSE push implementation.

### 2. Technical Debt & Risks
* **SCM Services Privilege Overreach (TD-101)**: Windows service wrappers run under elevated Admin accounts.
* **SQLite Sizing Restrictions (TD-103)**: SQLite database lacks clustering capability for multi-node setups.
* **GPU Memory Bottleneck (RSK-002)**: Concurrent loading of reasoning models causes CUDA out-of-memory errors.

### 3. Optimization Opportunities
* **Dynamic Model Offloading**: Automatically unload models from GPU VRAM to system memory when idle for $> 10$ minutes.
* **Token Pruning**: Clean history threads before routing context to inference proxies to reduce token volume.

---

## LEVEL 18: Diagram Generation Metadata

### Mermaid: Component Dependencies (C4 Component Diagram)
```mermaid
graph TD
    subgraph Console Layer
        Dashboard[Admin Dashboard UI]
        Command[Command Palette]
    end
    subgraph Gateway Control Plane
        Kernel[Platform Kernel]
        Policy[Policy Enforcer]
        Healer[Self Healer]
    end
    subgraph Persistence Layer
        DB[(PostgreSQL / SQLite)]
        Cache[(Redis Cache)]
    end
    subgraph Model Routing & Inference
        Router[LiteLLM Proxy]
        Ollama[Ollama daemon]
        GPU[NVIDIA GPU]
    end
    
    Dashboard -->|API call| Kernel
    Command -->|Query registry| Kernel
    Kernel -->|Write state| DB
    Kernel -->|Enforce rules| Policy
    Kernel -->|Poll health| Healer
    Healer -->|Restart commands| Router
    Policy -->|Forward query| Router
    Router -->|Queue jobs| Cache
    Router -->|Matrix multiply| Ollama
    Ollama -->|CUDA tensors| GPU
```

---

## LEVEL 19: Prompt Library

### 1. Generating Executive Context Posters
```
Act as a Principal Enterprise Architect. Generate a Mermaid C4 System Context diagram for AegisOS. Ensure the diagram clearly displays the boundaries between the local workstation console, the LiteLLM routing proxy, and the PostgreSQL persistence layer. Highlight all external trust boundaries and denote protocols (HTTPS, JSON-RPC, PostgreSQL protocol) along the communication vectors. Output clean, compile-ready Mermaid syntax.
```

### 2. Generating System Sequence Diagrams
```
Generate a high-fidelity PlantUML sequence diagram illustrating the AegisOS self-healing loop. The diagram must involve the Observability Agent, the Control Plane diagnostics monitor, the SQLite audit database, and the local Ollama inference service. Show how a VRAM Out-of-Memory warning triggers automatic process unloading and service port recovery steps. Use standard PlantUML sequence notation.
```

---

## LEVEL 20: Appendices

### 1. System Port Bindings

| Port | Service Name | Protocol | Access Scope |
|---|---|---|---|
| **3000** | Next.js Console Dashboard | HTTP | Workstation Localhost |
| **18789** | AegisOS Gateway API | HTTP / WebSockets | Localhost / Private VPN |
| **4000** | LiteLLM Proxy Router | HTTP | Localhost Only |
| **11434** | Ollama Inference Daemon | HTTP | Localhost Only |
| **5432** | PostgreSQL Relational Store | TCP | Localhost Only |
| **6379** | Redis Cache & Queue Manager | TCP | Localhost Only |
| **9000** | MinIO Object Storage | HTTP / S3 | Localhost Only |
| **9090** | Prometheus Scraper Engine | HTTP | Localhost Only |
| **3001** | Grafana Performance Console | HTTP | Workstation Localhost |
| **16686** | Jaeger Trace Collector UI | HTTP | Workstation Localhost |

### 2. Environment Variables

| Variable Name | Default Value | Purpose |
|---|---|---|
| `OPS_ENV` | `production` | Deployment profile setting |
| `OPS_GATEWAY_PORT` | `18789` | Port binding for local Gateway |
| `LITELLM_PROXY_URL` | `http://localhost:4000` | Target endpoint for model proxy |
| `OLLAMA_HOST` | `http://localhost:11434` | Target endpoint for local weights runner |
| `DATABASE_URL` | `postgresql://postgres:pwd@localhost:5432/aegis` | Database connection string |
| `REDIS_URL` | `redis://localhost:6379` | Key-value store link |
| `MINIO_ENDPOINT` | `localhost:9000` | S3 storage endpoint |

### 3. Master Glossary
* **Autonomic OS**: A system capable of self-management, self-healing, self-configuration, and self-optimization.
* **Control Plane (Layer 5)**: The regulatory layer monitoring telemetry and enforcing execution constraints.
* **Digital Twin**: The virtual state representation of platform components persisted in the relational database.
* **Model Context Protocol (MCP)**: An open standard protocol enabling models to securely query context tools.
* **Saga**: A design pattern implementing execution step logs to coordinate rollback on failures.
