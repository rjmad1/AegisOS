# 05. Visualization and Interaction Architecture

## Visualization Standards
- **Topology Graphs**: Used for Architecture Explorer and Digital Twins. Nodes must clearly differentiate Participants (Circles), Workflows (Diamonds), and Capabilities (Squares). Edge thickness represents interaction volume.
- **Execution Timelines**: Used for Observability Traces. Horizontal Gantt-style charts illustrating span durations, grouped by causative correlation IDs.
- **Resource Heatmaps**: Used for PRM utilization tracking across cluster nodes.
- **Certification Trees**: Hierarchical expand/collapse views for ERWC compliance matrices.

## Interaction Architecture
- **Navigation & Command Palette**: Keyboard-first design. Ctrl+K must always capture focus. Arrow keys navigate selections. Enter executes.
- **Drill-Downs**: Clicking any metric, node, or ID must preserve horizontal context and push a new route to the stack with breadcrumbs automatically updated.
- **Batch Operations**: Selecting multiple participants or workflows via inline checkboxes exposes a floating action bar (e.g., Pause, Terminate, Allocate).
- **Human-in-the-Loop (HITL)**: Approval flows block execution with a modal dialog requiring explicit 'Permit' or 'Deny' input, logging the operator's ID via the Policy Service.

## Notification & Recommendation Architecture
- **Alerts**: Critical system failures or invariant violations. Persistent red banners requiring dismissal.
- **Warnings**: Approaching budget thresholds. Yellow toast notifications with 5-second auto-dismiss.
- **Recommendations**: PAOS-driven suggestions. Grouped in a dedicated Dashboard widget. Include: 
  - *Reasoning* (e.g., High Latency)
  - *Benefit* (e.g., 20% throughput increase)
  - *Confidence* (e.g., 95%)
  - *1-Click Action* (e.g., Scale Up)
