# 04. Capability Mapping & Integration Strategy

## 1. Capability Mapping Architecture

We map candidate capabilities into the target UAWOS architecture. Open WebUI is positioned strictly as a stateless presentation client (Operator Experience Layer). All core capabilities, agent orchestrations, memory stores, and policies are mapped to AegisOS services.

```mermaid
graph TD
    %% Capability Mapping Path
    subgraph Presentation Layer
        UI[Open WebUI Portal :8090]
    end

    subgraph AegisOS Core Gateway
        OC_Cont[AegisOS API Gateway :18789]
        Auth[Identity & SSO Service]
        Policy[Policy Engine & RBAC]
        Audit[Audit Logger]
        Ingest[Central Ingestion Pipeline]
    end

    subgraph Agent Orchestration Layer
        Orch[Agent Orchestrator]
        DevAgent[Developer Agent]
        PlanAgent[Planner Agent]
        ReviewAgent[Reviewer Agent]
        ResearchAgent[Research Agent]
    end

    subgraph Data & Context Services
        Memory[Private Memory Service]
        KnowRep[Knowledge Platform]
        DB_Cont[Relational Persistence DB]
        HR_Cont[Headroom Proxy :4050]
        PT_Cont[Ponytail Filter]
    end

    subgraph Downstream Routing
        LL_Cont[LiteLLM Proxy :4000]
        ModelReg[Model Registry]
    end

    %% Mappings
    UI -->|REST / WS| OC_Cont
    OC_Cont --> Auth
    OC_Cont --> Policy
    OC_Cont --> Audit
    OC_Cont --> Ingest
    
    OC_Cont --> Orch
    Orch --> DevAgent
    Orch --> PlanAgent
    Orch --> ReviewAgent
    Orch --> ResearchAgent

    Orch --> Memory
    Orch --> KnowRep
    Orch --> DB_Cont
    Orch --> PT_Cont
    Orch --> HR_Cont

    HR_Cont --> LL_Cont
    LL_Cont --> ModelReg
```

---

## 2. In-Context Inference Pipeline

Context optimization occurs sequentially. In this architecture, all user inputs and file uploads are received by the AegisOS API Gateway first, which resolves identity, policies, and file ingestion before dispatching to agents. The agents condense context and prune tokens before sending them downstream to LiteLLM.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Open-WebUI Client
    participant OC as AegisOS API Gateway
    participant AG as Agent Orchestrator
    participant PT as Ponytail Context Filter
    participant HR as Headroom Token Pruner
    participant LL as LiteLLM Routing Proxy
    participant OL as Ollama Engine

    User->>UI: Type prompt & upload document
    UI->>OC: Forward request & auth token
    Note over OC: Verifies identity, validates RBAC, logs audit entry
    Note over OC: Processes upload in central ingestion pipeline (AegisOS owns it)
    OC->>AG: Request execution for user
    Note over AG: Resolves private user memory & scopes organizational knowledge
    Note over AG: Dynamically decides agent path (Planner / Developer / Researcher)
    AG->>PT: Apply Context Summarization & Laziness Filter
    Note over PT: Condenses history, injects Ponytail YAGNI constraints
    PT-->>AG: Condensed context
    
    AG->>HR: Apply Prompt Compression
    Note over HR: Applies CodeCompressor (AST mapping) & SmartCrusher (JSON pruning)
    HR-->>AG: Pruned prompt tokens
    
    AG->>LL: Send Request
    Note over LL: Selects route (Ollama / Cloud) based on cost, policy, and availability
    LL->>OL: Forward Request
    OL-->>LL: Generate Output
    LL-->>AG: Return Response
    AG-->>OC: Return Response
    OC-->>UI: Stream tokens back to client
    UI-->>User: Render output
```

---

## 3. Updated C4 Level 2 Container Diagram

The target architecture decouples the stateless Open WebUI portal, making it run as a thin client pointing only to the AegisOS gateway on port `:18789`.

```mermaid
graph TB
    subgraph Client Application Layer
        UI[Open-WebUI Portal :8090]
        Console[Console UI Dashboard :3000]
    end

    subgraph UAWOS Core Runtime
        OC[AegisOS AI Gateway :18789]
        Orch[Agent Orchestrator]
        HR[Headroom Compression Layer :4050]
        LL[LiteLLM Routing Proxy :4000]
        OL[Ollama Inference Engine :11434]
    end

    subgraph Local Context Layer
        FS[Local Filesystem]
        MCP[MCP Context Servers]
        DB[(PostgreSQL / SQLite DB)]
        KR[Hierarchical Knowledge Catalog]
        Memory[Private Memory Store]
    end

    %% Interactions
    UI -->|API Gateway Route Only| OC
    Console -->|HTTP API| OC
    OC --> Orch
    Orch -->|Prompt Data| HR
    HR -->|Compressed Prompt| LL
    LL -->|Inference Pass| OL
    Orch <-->|Context Queries| MCP
    Orch <-->|Memory I/O| Memory
    MCP --> FS
    MCP --> DB
    MCP --> KR
```

---

## 4. Loose-Coupling Interface Rules

To maintain high architectural governance, components must communicate strictly through services. Direct integration between individual modules is prohibited:

- **Upload Ingestion Mapping**:
  `Open WebUI Upload` -> `AegisOS Ingestion API` -> `Hierarchical Knowledge Catalog (Organized Scopes)` -> `Agent Orchestrator`.
  *PROHIBITED*: `Open WebUI` -> Direct mounting of local upload directories as RAG context.
  
- **Identity & Authentication Mapping**:
  `Open WebUI User` -> `AegisOS Auth (JWT/SSO)` -> `Individual Audit Trail & Resource Quotas`.
  *PROHIBITED*: Direct use of a single shared admin account on the workstation for multiple users.

- **Agent Invocation Mapping**:
  `Open WebUI` -> `AegisOS Gateway Request` -> `AegisOS Agent Selection (Planner/Dev/Reviewer)`.
  *PROHIBITED*: Open WebUI directly managing model profiles or calling LiteLLM endpoints bypassing AegisOS logic.

- **Plugins and Tools Mapping**:
  `User Command / Tool Request` -> `AegisOS Capability Registry` -> `Audited Capabilities Execution`.
  *PROHIBITED*: Open WebUI running tool integrations or code execution environments locally.
