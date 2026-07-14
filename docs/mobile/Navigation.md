# UAWOS Mobile Command Center: Information Architecture & Navigation

This document specifies the Navigation Hierarchy, Deep Link mappings, Global Search behaviors, and Information Architecture of the application.

---

## 1. Information Architecture (IA)

The application structures information to prioritize SRE status monitoring, conversational accessibility, and agent coordination.

```
UAWOS Mobile App Root
├── [Tab 1] Mission Control (Cockpit)
│   ├── Connection Indicator --> Connection Settings
│   ├── Telemetry Quick-Card --> Monitoring Details
│   ├── Approval Banner --> Human Approval Queue
│   └── Active Agents Summary --> Agents List
├── [Tab 2] AI Assistant (Chat Interface)
│   ├── History Drawer
│   └── Active Session --> Model Selector / Token Info
├── [Tab 3] Human Approvals (HITL Queue)
│   ├── Pending Approvals List --> Detailed Approval Card (Git Diff, Shell execution)
│   └── Execution Logs History
├── [Tab 4] Agents Control Room
│   ├── Agent Swarms Grid --> Node Graph / Live Log Stream
│   └── Workflows & Templates List
└── [Tab 5] Monitoring & Telemetry
    ├── GPU/VRAM Time-Series Charts
    └── Host Containers & Services List --> Log Stream Inspector
```

---

## 2. Navigation Hierarchy

The application employs an **Adaptive Navigation System** that reconfigures based on screen sizes and device states:

### A. Compact Mode (Standard Smartphones)
*   **Bottom Navigation Bar**: Exposes the 5 primary tabs: Mission Control, Chat, Approvals, Agents, and Monitoring.
*   **Swipe-out Drawer**: Accessible via profile picture in top-left. Houses global settings, SSH keys, certificate sharing, device pairings, and local file storage explorer.
*   **Details Screens**: Pushed onto the navigation stack (sliding in from the right) with a standard back button on top-left.

### B. Medium & Expanded Mode (Tablets & Foldables)
*   **Left Navigation Rail**: Collapsible rail containing the 5 main tabs, settings, and workspace folders.
*   **Split-pane Grid**: 
    *   *Landscape Foldables*: Navigation Rail on left, active conversation list on the center pane, active chat thread on the right pane.
    *   *Tablets*: Nav Rail + split dashboard showing live GPU charts side-by-side with active agent logs.

---

## 3. Deep Link Registry

The application registers the `uawos://` schema to enable seamless link routing from external developer environments (like IDE plugins or local terminal notifications):

| URI Pattern | App Destination | Action & Parameter Scope |
|---|---|---|
| `uawos://approvals` | Approvals Queue Tab | Opens the HITL queue screen. |
| `uawos://approvals/{id}` | Detailed Approval Sheet | Opens the specific approval card `id` directly, flashing the biometric verification prompt first. |
| `uawos://chat` | Assistant Tab | Opens a new chat session. |
| `uawos://chat/{session_id}` | Conversation Screen | Resumes conversation `session_id` from history. |
| `uawos://agents/{agent_id}` | Agent Inspector | Navigates directly to the live node graph and logs for `agent_id`. |
| `uawos://telemetry` | Monitoring Tab | Navigates to the real-time hardware performance charts. |

---

## 4. Global Command Palette & Search Behavior

The application features a global command search, activated by a swipe-down gesture from anywhere on the screen or tapping the search bar in the header:

*   **Behavior**: Modal dialog overlay (reminiscent of Raycast/Alfred).
*   **Smart Suggestions**: Recommends recent actions (e.g., *"Resume Gemma-32b Chat"*, *"Review Pending Approvals (3)"*).
*   **Prefix Modifiers**:
    *   `/chat [prompt]`: Instantly fires a prompt to the current active LLM model.
    *   `/load [model_name]`: Loads `model_name` into GPU VRAM.
    *   `/ssh [cmd]`: Dispatches `cmd` to the paired host shell interface.
    *   `/kill`: Kills the active selected agent run.
*   **Semantic Search Integration**: Searching normal text queries the local RAG metadata database (`raja-knowledge-repository`) and conversation logs, displaying highlighted snippets.
