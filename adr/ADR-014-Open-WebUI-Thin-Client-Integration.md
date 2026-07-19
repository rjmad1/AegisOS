# ADR-014: Open WebUI Thin Client Integration Architecture

## Status
Approved

## Context
AegisOS is evolved into a multi-user, enterprise-grade AI Work Operating System. Open WebUI provides a rich web chat user interface, but relying on Open WebUI as anything more than a presentation/operator experience layer creates significant security, compliance, scalability, and lifecycle management issues. We require a clear division of concerns: Open WebUI must remain a presentation layer (thin client), while AegisOS controls orchestration, memory, data access policies, auditing, and execution boundaries.

## Decision
We formally adopt a "decoupled thin-client" model for Open WebUI, integrating it strictly as the Operator Experience Layer. The architecture is defined around 12 core requirements:

1. **Model Routing**: Open WebUI is restricted from communicating directly with Ollama or LiteLLM. All requests are routed through the AegisOS API Gateway (`:18789`), ensuring centralized policy evaluation, token compression, auditing, and logging.
2. **Authentication & Identity**: The platform rejects shared admin credentials. Multiple knowledge workers must have individual identities and audit trails. Until a unified OIDC/JWT SSO integration is completed between Open WebUI and AegisOS, native Open WebUI authentication is enabled with a strict policy: one account per active user.
3. **Knowledge Ingestion & Management**: Open WebUI uploads are treated as AegisOS-owned platform knowledge assets. Files uploaded via the UI must flow through the central AegisOS ingestion pipeline where they are fingerprinted, versioned, tagged, embedded, indexed, and permissioned. Direct mounting of upload directories as canonical knowledge stores is prohibited.
4. **Code Execution**: The Developer Agent is the sole execution engine. Open WebUI's built-in code interpreters and local execution capabilities are disabled (`ENABLE_CODE_INTERPRETER=False`, `ENABLE_CODE_EXECUTION=False` in environment). All code execution is forwarded to the sandboxed AegisOS Developer Agent to centralize security policies, approvals, and resource limits.
5. **Multi-tenancy isolation**: Conversations, memories, and knowledge are isolated. The system enforces:
   - Shared organizational knowledge (global policies, standards).
   - User-specific private memories and settings.
   - Shared platform agents.
   - Separate user workspaces and role-based access control (RBAC).
6. **Agent Invocation**: The UI remains model-agnostic. Open WebUI submits standard chat requests to AegisOS. AegisOS dynamically determines which downstream agents (Planner, Researcher, Developer, Reviewer, etc.) are needed to fulfill the request. The UI does not directly invoke agents.
7. **Conversation Storage**: Conversations are stored in the AegisOS database. Open WebUI acts as a thin presentation client. This centralization facilitates global analytics, advanced cross-workspace search, and multi-device continuity.
8. **Knowledge Ownership**: AegisOS is the canonical owner and custodian of all uploaded documents and reference materials. Open WebUI is only the capture interface.
9. **Model Selection**: AegisOS determines which LLM (local Ollama models, Claude, Gemini, etc.) processes each request based on cost, context limits, current GPU/CPU workload, and privacy constraints. The UI cannot override or directly bind specific models.
10. **Plugins and Tools**: Open WebUI plugins must not execute tools directly. All tools are wrapped and executed as AegisOS capabilities, enforcing centralized authorization, auditing, and rate limiting.
11. **User Profiles**: Every workstation user is assigned a distinct profile specifying:
    - Personal workspaces and private scratchpads.
    - Private user memory.
    - Personal preferences/settings.
    - Personal API token quotas.
    - Individual uploaded assets.
    - Audit history logs.
12. **Hierarchical Knowledge Scopes**: To prevent cross-user data contamination and maintain retrieval performance, knowledge is separated into explicit scopes:
    - *Organization*: Shared documentation, SOPs, reference standards.
    - *Projects*: Scoped data repositories.
    - *Users*: Personal knowledge assets.
    - *Temporary Sessions*: Transient buffers.

## Consequences
- **Loose Coupling**: AegisOS can swap or update the frontend interface (e.g. migrating away from Open WebUI) in the future without rebuilding the core AI operating system services, agents, or databases.
- **Security & Auditing**: Centralized logging and token authentication on the AegisOS API Gateway ensure that all enterprise operations are logged and validated against RBAC rules.
- **Scalability**: Decoupling the frontend enables horizontal scaling of the gateway and inference proxies without complicating the user management layer.
