# AegisOS Studio Program (ASP)
## Module 05: Screen Specifications for Core Experiences

> **Status**: APPROVED  
> **Authority**: AegisOS Technical Steering Committee & UI Design Systems  
> **Reference Document**: [00_Master_ASP_Framework.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/asp/00_Master_ASP_Framework.md)  

---

## 1. Overview of Core Experiences

AegisOS Studio delivers eleven dedicated core screen experiences:

| Screen ID | Experience Name | Key Responsibility | Primary View Layout |
| :--- | :--- | :--- | :--- |
| **SCR-01** | Workspace Home | Central launchpad, active mission summary, quick actions | Grid Dashboard |
| **SCR-02** | Project Explorer | File tree, document navigation, local repo management | Tree View + Code Editor |
| **SCR-03** | Mission Center | Mission creation, status kanban, execution orchestration | Kanban + Split Canvas |
| **SCR-04** | Agent Console | Agent hierarchy, reasoning stream, tool execution log | Tree Node + Live Stream |
| **SCR-05** | Knowledge Graph | Bi-directional knowledge visualizer, vector semantic search | 2D/3D Graph + Inspector |
| **SCR-06** | Artifact Library | Browsable gallery of PDFs, MDs, Code, Architecture diagrams | Grid Gallery + Preview Canvas |
| **SCR-07** | Execution Timeline | Chronological event scrubber, latency breakdown, audit log | Gantt Timeline + Log Inspector |
| **SCR-08** | Extension Marketplace | Discover, install, and manage extensions and mission packs | Card Directory + Modal Detail |
| **SCR-09** | Capability Explorer | Platform tool registry, prompt library, model routing map | Search Table + Detail Pane |
| **SCR-10** | Global Search | Instant cross-domain search (`Cmd+K`) across all assets | Centered Modal Overlay |
| **SCR-11** | Settings | Workspace, perspective, keyboard shortcuts, platform config | Multi-tab Form View |

---

## 2. Exhaustive Wireframes & Screen Specifications

### SCR-01: Workspace Home
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ WORKSPACE HOME: AegisOS E-Commerce Workstation                       [+ New Mission]   │
├───────────────────────────────────────┬────────────────────────────────────────────────┤
│ ACTIVE MISSIONS (3)                   │ KNOWLEDGE HIGHLIGHTS                           │
│ ┌───────────────────────────────────┐ │ 📜 Architecture Decision Record 004            │
│ │ 🚀 Refactor Auth JWT Service      │ │ 🏷️ #security #jwt #authentication              │
│ │ Status: RUNNING (Step 4/7)        │ │ 🔗 14 cross-references to codebase             │
│ └───────────────────────────────────┘ │ ────────────────────────────────────────────── │
│ ┌───────────────────────────────────┐ │ RECENT ARTIFACTS                               │
│ │ 🔍 Security Vulnerability Audit   │ │ 📄 Auth_Refactor_Plan.md (Generated 5m ago)    │
│ │ Status: HITL GATE WAITING         │ │ 📊 Security_Scan_Report.pdf (Generated 1h ago)  │
│ └───────────────────────────────────┘ │                                                │
├───────────────────────────────────────┴────────────────────────────────────────────────┤
│ ACTIVE AGENT SWARM TELEMETRY: 4 Agents Active │ 1,240 tokens/sec │ 0 Errors            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### SCR-02: Project Explorer
- **Left Panel**: Multi-root file and folder tree with git status decorations (`M`, `A`, `U`, `D`).
- **Main Stage**: Multi-tab code & document editor supporting syntax highlighting, inline diffs, and AI code completion.
- **Right Panel**: Symbol outline, bi-directional knowledge links (`#supertags`), and CodeGraph references.

### SCR-03: Mission Center
- **Top Bar**: Filter by status (*All*, *Active*, *Paused*, *Completed*, *Failed*), Mission Pack Filter.
- **Main View**: Interactive Kanban columns (*Draft*, *Queued*, *Running*, *HITL Review*, *Completed*).
- **Detail Modal/Drawer**: Mission spec editor, step list with check-offs, subagent assignments, estimated completion time.

### SCR-04: Agent Console
- **Left Split**: Interactive Agent Delegation Graph (Visualizing Parent-Child Agent relationships: `Planner` &rarr; `Coder` &rarr; `Linter`).
- **Center Stream**: Real-time line-by-line reasoning stream with toggleable depth filters (*Thought*, *Tool Call*, *System Output*).
- **Right Panel**: Active tool parameters, tool execution latency, model prompt token counts, and memory allocation gauge.

### SCR-05: Knowledge Graph
- **Main Stage**: Interactive force-directed 2D/3D Knowledge Node Graph using D3/Canvas. Nodes represent Documents, Code Files, Artifacts, and Decision Records. Edge lines represent bi-directional references.
- **Top Control Bar**: Filter by Supertag (`#architecture`, `#security`), Link Strength Slider, Semantic Distance Filter.
- **Right Inspector**: Selected node summary, preview content, edit tags button, open referenced file link.

### SCR-06: Artifact Library
- **Gallery Grid**: Visual tiles displaying generated output artifacts categorized by format:
  - 📕 **PDFs**: Exec Summaries, Test Audit Reports.
  - 📝 **Markdown**: Specifications, Design Docs, Meeting Notes.
  - 🏛️ **Architecture**: PlantUML / Mermaid diagrams rendered visually.
  - 💻 **Code**: Multi-file patch sets, generated components.
- **Preview Canvas**: Full-screen split view for reading, editing, exporting, or continuing chat iteration on an artifact.

### SCR-07: Execution Timeline
- **Gantt Chart View**: Scratched timeline mapping every mission step, tool invocation, model generation turn, and HITL gate interval down to millisecond precision.
- **Log Inspector**: Correlated stdout/stderr logs and event bus message payloads for any selected timestamp segment.

### SCR-08: Extension Marketplace
- **Search & Category Navigation**: Browse by *Mission Packs*, *UI Themes*, *Perspectives*, *Tool Integrations*, *Custom Models*.
- **Card View**: Displays extension icon, title, publisher rating, installation status (`Installed`, `Update Available`, `Install`).
- **Detail View**: Readme, permissions required, public API bindings, configuration schema editor.

### SCR-09: Capability Explorer
- **Tool Registry Table**: Live table of all available agent capabilities (`view_file`, `run_command`, `git_commit`, `vector_search`).
- **Details**: Input schemas, permission level requirements, model availability matrix, execution history stats.

### SCR-10: Global Search (`Cmd + K`)
- **Centered Modal Overlay**: Instant fuzzy and vector search across all domain entities.
- **Results Grouping**: Grouped by *Workspaces*, *Projects*, *Missions*, *Knowledge Items*, *Artifacts*, and *Actions*.
- **Keyboard Navigation**: `Up`/`Down` arrows to navigate, `Enter` to open, `Tab` to filter domain context.

### SCR-11: Settings
- **Multi-Tab Navigation**:
  - **General**: Active theme (Dark/Light/Cyberpunk), language, startup perspective.
  - **Model Routing**: Default local model mappings (Fast vs. Reasoning models via LiteLLM/Ollama).
  - **Perspectives**: Customize custom layout configurations for the 6 persona perspectives.
  - **Keybindings**: VS Code compatible shortcuts map customization.
  - **Privacy & Telemetry**: Local-first telemetry policy settings.
