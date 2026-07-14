# Reusable UI Component Library

This catalog specifies the high-level reusable visual components and interactive controls for AegisOS Mobile.

---

## 1. Interactive Atoms

### 1.1 Buttons (`AegisButton`)
*   **Variants**: `Primary` (Solid neon indigo), `Secondary` (Ghost cyber cyan border), `Destructive` (Red fill), `Warning` (Amber fill).
*   **States**: Idle, Hover/Focus, Pressed, Disabled, Loading (with progress spinner).
*   **Touch target**: Minimum height of `48dp`.

### 1.2 Text Fields & Inputs (`AegisInput`)
*   **Properties**: Label text, placeholder, error message indicator, prefix/suffix icons.
*   **Aesthetics**: Charcoal background, 1dp outline border (glowing cyan on focus), Outfit body text.

---

## 2. Information Organisms

### 2.1 Host System Card (`HostSystemCard`)
*   **Purpose**: Displays workstation connectivity and daemon health.
*   **Visual Elements**: Green/Red status dot, CPU/GPU/VRAM bar graph summaries, host name label, last-seen timestamp.

### 2.2 Telemetry Metrics Chart (`TelemetryChart`)
*   **Purpose**: Displays real-time metrics (CPU, GPU, Memory, VRAM) over time (last 60 seconds).
*   **Aesthetics**: Glassmorphic card, smooth Bezier lines (cyan for memory, indigo for GPU, purple for CPU), auto-scaling grid lines.

### 2.3 Status Badges (`RiskBadge`)
*   **Purpose**: Indicates action danger level in the approval queue.
*   **Variants**:
    *   `Low`: Green text, dark green transparent capsule.
    *   `Medium`: Amber text, dark amber transparent capsule.
    *   `High`: Red text, dark red transparent capsule.
    *   `Critical`: Cyber magenta text, dark magenta transparent capsule.

---

## 3. Conversational AI & Rich Rendering

### 3.1 Chat Bubble (`ChatBubble`)
*   **Purpose**: Renders conversation exchanges.
*   **Styling**:
    *   *User*: Slate background, right-aligned, white text.
    *   *Assistant*: Subtle indigo gradient border, left-aligned, markdown text layout.
    *   *System*: Center-aligned, muted grey text, compact borders.

### 3.2 Live Log Terminal (`LogTerminalView`)
*   **Purpose**: Streams real-time stdout/stderr lines from agent processes.
*   **Aesthetics**: Monospace font (JetBrains Mono), black console background, amber text for stdout, red for stderr, green for command indicators. Supports auto-scroll and quick-copy lines.

### 3.3 Markdown & Diagram Renderer (`RichRenderer`)
*   **Purpose**: Displays LLM responses, including Markdown format table listings, bold/italics, code snippets, and Mermaid graphs (rendered via local webview).
