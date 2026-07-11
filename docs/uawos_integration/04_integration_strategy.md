# 04. Capability Mapping & Integration Strategy

## 1. Capability Mapping Architecture

We map candidate capabilities into the target UAWOS architecture. Capabilities are mapped to system containers, agents, registries, and knowledge stores rather than raw repositories.

```mermaid
graph TD
    %% Capability Mapping Path
    subgraph Capabilities Layer
        CodeIntel[Code Intelligence]
        TokenComp[Token Compression]
        ContextComp[Context Summarization]
        Planning[SDD Task Planning]
        Review[Consensus Review]
        Research[Background Research]
        Opt[Prompt Optimization]
    end

    subgraph Service Containers
        OC_Cont[OpenClaw Gateway]
        LL_Cont[LiteLLM Proxy]
        HR_Cont[Headroom Proxy]
        DB_Cont[SQLite Metadata DB]
    end

    subgraph Agents Layer
        DevAgent[Developer Agent]
        PlanAgent[Planner Agent]
        ReviewAgent[Reviewer Agent]
        ResearchAgent[Research Agent]
    end

    subgraph Registries & Knowledge
        ModelReg[Model Registry]
        PromptReg[Prompt Versioning Registry]
        KnowRep[Knowledge Platform]
    end

    %% Mappings
    CodeIntel --> OC_Cont
    OC_Cont --> DevAgent
    DevAgent --> DB_Cont

    TokenComp --> HR_Cont
    HR_Cont --> LL_Cont
    LL_Cont --> ModelReg

    ContextComp --> OC_Cont
    OC_Cont --> PromptReg

    Planning --> PlanAgent
    PlanAgent --> KnowRep

    Review --> ReviewAgent
    ReviewAgent --> LL_Cont

    Research --> ResearchAgent
    ResearchAgent --> KnowRep

    Opt --> PromptReg
```

---

## 2. In-Context Inference Pipeline

Context optimization occurs sequentially. Before prompts reach LiteLLM, they must go through context compression and token pruning stages.

```mermaid
sequenceDiagram
    autonumber
    participant UI as Open-WebUI Client
    participant OC as OpenClaw Agent Gateway
    participant PT as Ponytail Context Filter
    participant HR as Headroom Token Pruner
    participant LL as LiteLLM Routing Proxy
    participant OL as Ollama Engine

    UI->>OC: Submit Prompt & History (100k tokens)
    Note over OC: Inspects history length
    OC->>PT: Process Context (History + Prompt)
    Note over PT: Condenses history using local smollm model,<br/>enforces standard-library-only code instructions.
    PT-->>OC: Compressed History & Prompt (10k tokens)
    
    OC->>HR: Compress Prompt (JSON / AST)
    Note over HR: Applies CodeCompressor (AST mapping) & SmartCrusher (JSON pruning)
    HR-->>OC: Pruned Prompt (3.5k tokens)
    
    OC->>LL: Send Request (3.5k tokens)
    Note over LL: Identifies route fallbacks and binds targets
    LL->>OL: Forward Request
    OL-->>LL: Generate Output
    LL-->>OC: Return Response
    OC-->>UI: Return Final Answer
```

---

## 3. Updated C4 Level 2 Container Diagram

The target architecture introduces the `Headroom Proxy` and decouples background agents:

```mermaid
graph TB
    subgraph Client Application Layer
        UI[Open-WebUI Portal :8090]
        Console[Console UI Dashboard :20128]
    end

    subgraph UAWOS Core Runtime
        OC[OpenClaw AI Gateway :18789]
        HR[Headroom Compression Layer :4050]
        LL[LiteLLM Routing Proxy :4000]
        OL[Ollama Inference Engine :11434]
    end

    subgraph Local Context Layer
        FS[Local Filesystem]
        MCP[MCP Context Servers]
        DB[(SQLite Platform DB)]
        KR[RAG Knowledge Repository]
    end

    %% Interactions
    UI -->|REST / WS| OC
    Console -->|HTTP API| OC
    OC -->|Prompt Data| HR
    HR -->|Compressed Prompt| LL
    LL -->|Inference Pass| OL
    OC <-->|Context Queries| MCP
    MCP --> FS
    MCP --> DB
    MCP --> KR
```

---

## 4. Loose-Coupling Interface Rules

To maintain high architectural governance, components must communicate strictly through services. Direct integration between individual modules is prohibited:

- **AutoResearch Output Mapping**:
  `AutoResearch` -> `Knowledge Platform (Markdown Files)` -> `RAG MCP Server` -> `OpenClaw` -> `Developer Agent`.
  *NOT*: `AutoResearch` -> `Developer Agent` (bypassing registries).

- **Spec Kit Planning Mapping**:
  `Spec Kit` -> `Planning Service (CLI API)` -> `Planner Agent` -> `OpenClaw` -> `Developer Agent`.
  *NOT*: `Spec Kit` -> `Developer Agent`.

- **SkillOpt Prompt Mapping**:
  `SkillOpt` -> `Prompt Registry` -> `OpenClaw Config` -> `Model call`.
  *NOT*: `SkillOpt` -> `LiteLLM` (direct template modification).
