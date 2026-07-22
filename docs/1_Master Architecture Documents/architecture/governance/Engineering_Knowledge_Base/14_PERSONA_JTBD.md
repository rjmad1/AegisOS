# AegisOS Engineering Knowledge Base (EKB)
## 14_PERSONA_JTBD.md — Persona Analysis & Jobs-To-Be-Done (JTBD) Mapping Specification

---

### 1. Enterprise Persona Profiles

#### 1.1 The Enterprise Software & Systems Architect (Primary Buyer)
* **Demographics / Role**: Chief Architect, Enterprise Architect, Principal Security Engineer.
* **Core Goals**: Maintain architectural integrity, ensure zero-trust compliance, eliminate shadow AI usage, and establish verifiable audit trails across multi-agent workflows.
* **Primary Pain Points**:
  * Inability to inspect or restrict dynamic AI tool executions on internal networks.
  * Opaque LLM reasoning paths violating corporate compliance standards.
  * Risk of data exfiltration through cloud-hosted AI copilot services.
* **Decision Criteria**: Adherence to formal architectural baselines (7-layer stack), cryptographic transaction logging, zero-trust RBAC support, and host isolation.
* **Adoption Barriers**: Lack of enterprise single sign-on (SSO) or unverified third-party code execution safety.

#### 1.2 The Site Reliability Engineer & Operations Lead (System Operator)
* **Demographics / Role**: Lead SRE, Infrastructure Operations Manager, DevOps Engineer.
* **Core Goals**: Guarantee high workstation availability, prevent GPU VRAM memory exhaustion, automate recovery of crashed background services, and monitor AI telemetry.
* **Primary Pain Points**:
  * Unpredictable VRAM memory spikes causing system freezing during large LLM inference runs.
  * Opaque agent loop failures requiring manual service restarts.
  * Lack of unified observability combining system metrics (CPU/VRAM/Disk) with AI execution telemetry.
* **Decision Criteria**: Autonomic self-healing features, real-time CUDA telemetry, automated cloud spillover thresholds, and standard OpenTelemetry (OTLP) exports.

#### 1.3 The Enterprise Knowledge Worker & Analyst (End User)
* **Demographics / Role**: Financial Analyst, Research Scientist, Technical Product Manager, Legal Specialist.
* **Core Goals**: Automate tedious multi-step research, document synthesis, meeting summarization, and local data analysis without coding skills.
* **Primary Pain Points**:
  * Existing chat interfaces lack access to local workstation files and corporate knowledge repositories.
  * Privacy restrictions prevent uploading confidential financial/legal documents to public cloud APIs.
  * Hallucinations in generic AI outputs without deterministic verification.
* **Decision Criteria**: Frictionless UI integration (Conversa Workspace), local-first privacy, dynamic tool availability (MCP), and cryptographic decision signing.

#### 1.4 The Enterprise IT & Identity Administrator (Governance Administrator)
* **Demographics / Role**: Director of IT, IAM Administrator, CISO.
* **Core Goals**: Centralize access management, manage corporate directory federation, enforce security policies, and manage cloud token spend.
* **Primary Pain Points**:
  * Scattered local AI applications bypassing corporate directory single sign-on and offboarding policies.
  * Inability to revoke local workstation AI access upon employee departure.
* **Decision Criteria**: Out-of-the-box SAML 2.0 / OIDC identity provider integration, automated RBAC role mapping, and centralized audit logging.

---

### 2. Jobs-To-Be-Done (JTBD) Mapping Matrix

| Job ID | Job Statement ("When I... I want to... So that I can...") | Persona | Supported Subsystem / Service | Current AegisOS Support Status |
| :--- | :--- | :--- | :--- | :---: |
| **JTBD-01** | When an agent requests a destructive filesystem or shell command, I want to review and cryptographically authorize it on my paired mobile device, so that high-risk actions never execute without human consent. | Architect / SRE | `aegis_mobile/`, `src/platform/control/` (ECDSA Signer) | 🟢 **Fully Supported (GA 1.0)** |
| **JTBD-02** | When local GPU VRAM is saturated during a large inference batch, I want the system to seamlessly route requests to Azure OpenAI, so that my workstation does not freeze or throw OOM errors. | SRE / Analyst | `CloudSpilloverRouter.ts`, `OllamaProvider.ts` | 🟢 **Fully Supported (GA 1.2)** |
| **JTBD-03** | When authenticating to AegisOS, I want to sign in with my enterprise Azure Entra ID credentials, so that IT can enforce centralized identity and access control. | IT Admin | `SamlProvider.ts` | 🟢 **Fully Supported (GA 1.2)** |
| **JTBD-04** | When a background agent or runtime daemon crashes, I want the OS to detect state drift and restart it automatically, so that system uptime is maintained without manual intervention. | SRE | `SelfHealingFramework.ts`, `ConvergenceEngine.ts` | 🟢 **Fully Supported (GA 1.0)** |
| **JTBD-05** | When running third-party extension tools, I want them executed in restricted worker sandboxes, so that untrusted code cannot access unauthorized host directories or network interfaces. | Architect / IT | `ExtensionRuntimeService.ts` (Worker Threads VM) | 🟢 **Fully Supported (GA 1.0)** |
| **JTBD-06** | When executing multi-step complex workflows, I want to checkpoint each state step in a database log, so that failures can be rolled back or resumed idempotently. | Architect | `WorkflowService.ts` (Saga Engine) | 🟢 **Fully Supported (GA 1.0)** |
| **JTBD-07** | When conducting complex multi-agent debates, I want agents to reach consensus before writing final results, so that outputs are verified across specialized model perspectives. | Analyst | `conversa_repo/` | 🟡 **Weak / In Progress (Target: Next Milestone)** |
| **JTBD-08** | When connecting to corporate data sources (SharePoint, Google Drive, Jira), I want native MCP connectors available out-of-the-box, so that I don't have to manually upload local files. | Knowledge Worker | `src/platform/mcp/` | 🟡 **Weak / Planned (Ecosystem Program 2)** |
