# 03. Repository Evaluation Matrix & Adoption Decisions

We evaluate each repository independently to determine its architectural fit, complexity, maintenance impact, strategic value, and final adoption status.

---

## 1. Summary Matrix Table

| Repository | Strategic Value | Complexity | Maintenance | Expected ROI | Recommended Decision | Primary Role |
|---|---|---|---|---|---|---|
| **CodeGraph** | High | Medium | Low | High | **Interface Only** | Semantic Code Intelligence (MCP) |
| **Spec Kit** | Medium | Low | Low | Medium | **Interface Only** | Specification-Driven Dev (Planning Service) |
| **Headroom** | High | Low | Low | High | **Adopt** | Prompt Compression & Token Optimizer |
| **Ponytail** | High | Low | Low | High | **Adopt** | Context Compression & Lazy Philosophy |
| **LLM Council** | High | Medium | Medium | High | **Interface Only** | Multi-Model Consensus (Review Service) |
| **AutoResearch** | Medium | High | High | Medium | **Interface Only** | Background Research Platform |
| **SkillOpt** | Medium | Medium | Medium | Medium | **Interface Only** | Prompt Optimization Service |
| **Knowledge Catalog** | Low | High | High | Low | **Defer** | Enterprise Metadata Governance |

---

## 2. In-Depth Repository Assessments

### 1. CodeGraph
- **Purpose**: Creates local semantic graphs of code structures using tree-sitter, SQLite, and FTS5.
- **Architectural Layer**: Context Layer / Developer Intelligence.
- **Dependencies**: Node.js, tree-sitter, SQLite.
- **Capabilities Introduced**: Pre-indexed semantic code intelligence, code graph structure queries, cross-file impact analysis.
- **Capabilities Duplicated**: Basic text search (ripgrep) and directory walks (filesystem provider).
- **Existing Implementation**: basic filesystem and git providers exist in OpenClaw. No AST parsing or dependency indexing.
- **Integration Complexity**: Low (exposes an out-of-the-box MCP server).
- **Maintenance Burden**: Low (runs locally, fully self-contained).
- **Expected ROI**: High (reduces agent code discovery loops, saving up to 80% search token consumption).
- **Decision**: **Interface Only**
- **Justification**:
  - *Business*: Increases developer agent output accuracy and speeds up code exploration.
  - *Technical*: Integrates as a pre-built MCP server in OpenClaw (`configs/openclaw/openclaw.json`).
  - *Architectural*: Avoids bringing CodeGraph source code into the UAWOS repository. Keeps the agent runtime loosely coupled via standard MCP interfaces.

### 2. Spec Kit
- **Purpose**: Facilitates Spec-Driven Development (SDD) via CLI tools (`specify` CLI) for PRD and ADR generation.
- **Architectural Layer**: Planning Layer / Spec Generation.
- **Dependencies**: Node.js / CLI.
- **Capabilities Introduced**: Standardized task decomposition, ADR template structures, project spec generation.
- **Capabilities Duplicated**: Prompt-based planning templates (duped in OpenClaw prompt structures).
- **Existing Implementation**: Manual writing of specs and implementation plans.
- **Integration Complexity**: Low (CLI interface or static template mapping).
- **Maintenance Burden**: Low (stable standard templates, no runtime service dependencies).
- **Expected ROI**: Medium (improves task clarity and limits "vibe coding" errors).
- **Decision**: **Interface Only**
- **Justification**:
  - *Business*: Reduces architectural drift and project implementation errors.
  - *Technical*: Expose as a planning tool wrapped by OpenClaw's Planner Agent.
  - *Architectural*: Decouples template structures from runtime agent code. Prevents prompt registry duplication.

### 3. Headroom
- **Purpose**: Context compression layer to prune token consumption from logs, RAG chunks, and code files.
- **Architectural Layer**: Gateway / Proxy Layer (positioned directly before LiteLLM).
- **Dependencies**: Python, standard tokenizers, AST parsers (SmartCrusher, CodeCompressor).
- **Capabilities Introduced**: Dynamic AST-based code compression, JSON pruning, prompt context token reduction.
- **Capabilities Duplicated**: None. No compression is currently configured.
- **Existing Implementation**: Uncompressed raw string piping.
- **Integration Complexity**: Medium (must be placed inline in the model execution loop).
- **Maintenance Burden**: Low (standard library-like utility, deterministic compression algorithms).
- **Expected ROI**: High (reduces input tokens by 60–90%, lowering local inference context overhead).
- **Decision**: **Adopt** (Integrated inline)
- **Justification**:
  - *Business*: Reduces VRAM usage and speeds up model time-to-first-token (TTFT).
  - *Technical*: Placed directly before the LiteLLM routing proxy. Runs as a local Python script/library called via OpenClaw.
  - *Architectural*: Standardizes prompt optimization at the gateway boundary, protecting models from massive raw contexts.

### 4. Ponytail
- **Purpose**: Enforces "lazy senior developer" coding philosophy (simplest working code, standard libraries) and handles conversation context compression.
- **Architectural Layer**: Context Layer / Memory Pipeline.
- **Dependencies**: Markdown utilities, local model summarization calls.
- **Capabilities Introduced**: Conversational compression, auto-auditing for over-engineering (`ponytail-audit`), and debt ledger tracking (`ponytail-debt`).
- **Capabilities Duplicated**: None.
- **Existing Implementation**: None.
- **Integration Complexity**: Low (can be written as a custom typescript adapter).
- **Expected ROI**: High (preserves long-term chat session consistency, ensures lightweight codebase additions).
- **Decision**: **Adopt** (Integrated inline)
- **Justification**:
  - *Business*: Dramatically reduces long-term codebase technical debt and keeps maintenance costs low.
  - *Technical*: Integrated inline as the first stage of the context compression pipeline (`Conversation -> Ponytail -> Headroom -> LiteLLM`).
  - *Architectural*: Governs the codebase size and controls agent output growth.

### 5. LLM Council
- **Purpose**: Multi-model deliberation/debate system (blind peer review and chairman synthesis).
- **Architectural Layer**: Reasoning Layer / Review Service.
- **Dependencies**: Multi-model access (GPT, Claude, local models via LiteLLM).
- **Capabilities Introduced**: Multi-perspective validation, automated peer critiquing, debate synthesis.
- **Capabilities Duplicated**: Single-model code reviews (done by DeepSeek-R1 stub).
- **Existing Implementation**: Mocked API responses.
- **Integration Complexity**: Medium (requires coordinating multiple model calls in parallel).
- **Maintenance Burden**: Medium (model API drift, increased response latency if misconfigured).
- **Expected ROI**: High (virtually eliminates code logic bugs and architectural flaws during reviews).
- **Decision**: **Interface Only**
- **Justification**:
  - *Business*: Ensures high-quality code verification for mission-critical modifications.
  - *Technical*: Invoked only on demand during git pre-commit hooks or PR checks. Excluded from normal chat workflows to preserve zero-latency chat execution.
  - *Architectural*: Exposed as an asynchronous review service accessed via REST.

### 6. AutoResearch
- **Purpose**: Runs background research and code experimentation loops (edit-run-evaluate "ratchet loops").
- **Architectural Layer**: Background Agent Layer / Knowledge Ingestion.
- **Dependencies**: Python, PyTorch (optional), headless browsers, shell execution.
- **Capabilities Introduced**: Autonomous documentation generation, local code experimentation, architectural radars.
- **Capabilities Duplicated**: Local execution code running (duped by OpenClaw shell execution capabilities).
- **Existing Implementation**: None.
- **Integration Complexity**: High (requires isolated sandbox environments to safely run iterations).
- **Maintenance Burden**: High (running arbitrary code loops locally can hang or exhaust disk).
- **Expected ROI**: Medium (valuable for overnight coding research, but high compute utilization).
- **Decision**: **Interface Only**
- **Justification**:
  - *Business*: Automates technology research and codebase diagnostics without developer time.
  - *Technical*: Triggered as a background batch task writing outputs directly to the `$PlatformRoot/knowledge` repository.
  - *Architectural*: Restricts code execution permissions. Does not participate in the core client chat loop.

### 7. SkillOpt
- **Purpose**: Treats agent prompt templates as trainable parameters, optimizing system instructions iteratively.
- **Architectural Layer**: Optimization Layer / Prompts.
- **Dependencies**: Python, test benchmark sets.
- **Capabilities Introduced**: Prompt optimization loops, system instructions tuning, prompt regressions testing.
- **Capabilities Duplicated**: Prompt registries (duped by OpenClaw configs).
- **Existing Implementation**: Static YAML/JSON prompt definitions.
- **Integration Complexity**: Medium (requires a dataset of test cases to optimize against).
- **Maintenance Burden**: Medium (requires active supervision and execution configurations).
- **Expected ROI**: Medium (improves model instruction-following accuracy).
- **Decision**: **Interface Only**
- **Justification**:
  - *Business*: Maximizes performance of smaller models (like Gemma 9B) on specialized local tasks.
  - *Technical*: Exposed as an on-demand optimizer service. Never wraps active runtime execution loops.
  - *Architectural*: Coordinates prompts centrally, outputting changes back to the versioned prompt registry.

### 8. Google Knowledge Catalog (OKF)
- **Purpose**: Enterprise metadata governance catalog implementing the Open Knowledge Format (OKF).
- **Architectural Layer**: Metadata Governance Layer.
- **Dependencies**: GCP BigQuery, metadata lineage tools, catalog frameworks.
- **Capabilities Introduced**: Enterprise metadata lineage, asset tagging, governance compliance.
- **Capabilities Duplicated**: Lightweight flat file indexing (`artifact-registry.ts`).
- **Existing Implementation**: Local registry scanning via `artifact-registry.ts`.
- **Integration Complexity**: High (designed for enterprise cloud infrastructure).
- **Maintenance Burden**: High (requires cloud bindings, catalog syncing, and permissions mappings).
- **Expected ROI**: Low (overkill for a local single-workstation environment).
- **Decision**: **Defer**
- **Justification**:
  - *Business*: High cloud integration cost with negligible returns for local-first developer productivity.
  - *Technical*: OKF's database structure conflicts with the local markdown schema of the workstation.
  - *Architectural*: Defer implementation. Re-evaluate only if multi-developer team environments or cloud catalog integrations are requested in subsequent phases.
