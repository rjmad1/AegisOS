# 08. Developer & Configuration Guide

This guide describes how to configure, develop against, and maintain the new capabilities integrated into the AI Workstation platform.

---

## 1. System Integration Flow

The diagram below details the sequence of interactions when a Developer Agent initiates code generation using the newly integrated CodeGraph, Ponytail, and Headroom services:

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant OC as OpenClaw Gateway
    participant CG as CodeGraph MCP
    participant PT as Ponytail Context Filter
    participant HR as Headroom Proxy
    participant LL as LiteLLM Routing Proxy

    Dev->>OC: Requests Code Change ("Modify route.ts")
    OC->>CG: Query AST Dependencies for "route.ts"
    CG-->>OC: Return CodeGraph Node Relationships (SQLite index)
    
    Note over OC: Builds context containing related file content
    OC->>PT: Apply Context Summarization & Laziness Filter
    Note over PT: Condenses history, injects Ponytail YAGNI constraints
    PT-->>OC: Returns Condensed Context
    
    OC->>HR: Apply Prompt Compression
    Note over HR: SmartCrusher filters JSON; CodeCompressor compresses code AST
    HR-->>OC: Returns Compressed Tokens
    
    OC->>LL: Execute Model Call (DeepSeek-R1 / Qwen2.5)
    LL-->>OC: Returns Generated Code Diff
    OC-->>Dev: Presents Verified Diff Output
```

---

## 2. Configuration Parameters

Configurations are managed centrally in `console_config.json`. We add parameters for the newly adopted services:

```json
{
  "artifacts": {
    "rootDir": "./artifacts_storage"
  },
  "headroom": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:4050",
    "compressionRatioTarget": 0.75,
    "algorithms": ["smart-crusher", "code-compressor"]
  },
  "ponytail": {
    "enabled": true,
    "summarizationIntervalMs": 60000,
    "intensity": "full",
    "debtLedgerPath": "./artifacts_storage/ponytail_debt.json"
  },
  "services": {
    "codegraph": {
      "port": 18790,
      "dbPath": "./artifacts_storage/codegraph.sqlite"
    }
  }
}
```

---

## 3. Developer Integration Guide

### A. Registering CodeGraph as an MCP Server
To expose code intelligence to agents, add the CodeGraph configuration to `configs/openclaw/openclaw.json`:

```json
{
  "mcpServers": {
    "codegraph": {
      "command": "node",
      "args": ["C:/ProgramData/AI/bin/codegraph-mcp/index.js"],
      "env": {
        "CODEGRAPH_DB_PATH": "D:/AIPlatform/databases/codegraph.sqlite"
      }
    }
  }
}
```

### B. Accessing the Planning Service (Spec Kit)
Developers can run Spec Kit CLI commands locally to generate specifications:
```bash
# Initialize a new SDD specification cycle
npx spec-kit specify --title "Integrate Model Metadata Engine"

# Validate codebase against SDD constitution principles
npx spec-kit audit
```

### C. Monitoring Token Savings (Headroom Metrics)
To view active compression logs and performance gains, check the Headroom metrics API:
```bash
curl http://127.0.0.1:4050/metrics
```
Expected output:
```json
{
  "total_prompts_processed": 1420,
  "raw_tokens": 12450000,
  "compressed_tokens": 3112500,
  "average_reduction_percentage": 75.0
}
```

### D. Enforcing Ponytail Laziness Checks
Run Ponytail checks locally to verify if a proposed code change violates "Capability Before Code" or duplicates existing standard library features:
```bash
# Audit codebase for over-engineering
npx ponytail-audit --path ./src

# Harvest marked shortcuts and display the tech debt scoreboard
npx ponytail-debt --status
```
