# Dependency Graph

| Metadata | Value |
|---|---|
| **Document ID** | DPG-2026-001 |
| **Version** | 1.0.0 |

## Component Dependency Relationships
`mermaid
flowchart TD
    UI[Console Admin UI] --> ECP[Executive Control Plane]
    ECP --> Workflow[Workflow Engine]
    Workflow --> Agent[Multi-Agent Collaborator]
    Agent --> MCP[MCP Host Engine]
    MCP --> RAG[Knowledge Repository]
    Agent --> Router[LiteLLM Proxy]
    Router --> Inference[Ollama Instance]
`
