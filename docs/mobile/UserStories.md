# UAWOS Mobile Command Center: User Personas, Journeys & Stories

This document defines the key User Personas, their Operational Journeys, and detailed User Stories with Acceptance Criteria.

---

## 1. User Personas

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TARGET PERSONAS                               │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Casual User    │ 2. Power User     │ 3. AI Engineer                 │
│ (Alex, Individual)│ (Brian, Automator)│ (Elena, Model Optimizer)       │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 4. Product Manager│ 5. AI Researcher  │ 6. Enterprise Admin            │
│ (Marcus, Manager) │ (Sophia, Analyst) │ (Diana, Security/Compliance)   │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ 7. DevOps/SRE     │ 8. Executive      │                                │
│ (Frank, infra)    │ (Victoria, CFO)   │                                │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1. Alex - The Individual (Casual User)
*   **Background**: Uses UAWOS at home to manage personal tasks, drafts emails, and query local notes.
*   **Goal**: Have a fast, private assistant on their phone that accesses home workstation data.
*   **Pain Point**: Standard apps leak search data; setting up remote access is too complex.

### 2. Brian - The Power User (Automator)
*   **Background**: Integrates home smart devices and schedules scraping/sorting workflows.
*   **Goal**: Monitor triggers and handle occasional approval cards when away from his desk.
*   **Pain Point**: Workflows hang when they hit an exception or require a credential prompt.

### 3. Elena - The AI Engineer
*   **Background**: Develops agent prompt templates, custom MCP servers, and tests model architectures.
*   **Goal**: Remotely inspect model routing metrics, check output quality, and swap model files.
*   **Pain Point**: Sitting at a desk to check long-running evaluations is draining.

### 4. Marcus - The Product Manager
*   **Background**: Validates AI feature quality and reviews code before release.
*   **Goal**: Approve code refactoring agent runs via clear diff visualizers.
*   **Pain Point**: Too many notifications that lack context or diff highlights.

### 5. Sophia - The AI Researcher
*   **Background**: Runs long-running datasets through semantic indexing and RAG nodes.
*   **Goal**: Check RAG chunk statistics and trigger indexing jobs remotely.
*   **Pain Point**: Unstable Wi-Fi interrupts console-based indexing scripts.

### 6. Diana - The Enterprise Administrator
*   **Background**: Manages company-wide AI deployments, IAM policies, and workstation configurations.
*   **Goal**: Remotely revoke keys of lost devices and audit system access history.
*   **Pain Point**: No audit trail or remote client certificate manager.

### 7. Frank - The SRE / DevOps Engineer
*   **Background**: Monitors multi-GPU clusters and load balancers.
*   **Goal**: Track VRAM leakage, monitor temperature, and throttle rogue agent processes.
*   **Pain Point**: Waking up at night to ssh into a terminal to restart Ollama.

### 8. Victoria - The Executive (CFO/VP)
*   **Background**: Tracks organizational AI utilization and ROI metrics.
*   **Goal**: View executive summary dashboard representing team task completions.
*   **Pain Point**: Technical dashboards are overwhelming; wants high-level graphs.

---

## 2. User Journeys

### Journey 1: Remote Telemetry Monitoring & Mitigation (Frank - SRE)
1.  Frank receives a critical system alert via secure push notification: *"GPU 0 Temperature Exceeds 85°C. Queue Latency > 12s."*
2.  Frank unlocks the app with FaceID. The app opens immediately to the **Monitoring** tab over Tailscale VPN.
3.  He views a graphical timeline showing a VRAM spike caused by a rogue researcher running Gemma-27B alongside DeepSeek-32B.
4.  Frank taps **Infrastructure**, locates the Docker container for the experimental routing path, and taps **Throttle** to reduce its execution rate limit to 5 tokens/sec.
5.  He watches the temperature line chart stabilize to 72°C. He posts a quick comment to the system timeline log: *"Throttled Gemma-27b runtime, system restored."*

### Journey 2: Human-in-the-Loop Agent Code Approval (Marcus - Product Manager)
1.  Marcus is waiting in line for coffee when his phone vibrates with a high-priority approval notification: *"Agent CodeGraph-04 requests write access to index.ts"*.
2.  He taps the notification, which opens the **Human Approval Queue** screen.
3.  He reviews the requested action: a clear, color-coded Git diff showing code additions and deletions.
4.  He spots an imported library that hasn't been approved for use in production.
5.  Marcus slides the rejection option, taps the text box, types: *"Do not use external library X. Rewrite using the native standard library."* and submits.
6.  The agent on the workstation receives the rejection, re-runs its planner loop, corrects the code, and submits a new approval card 3 minutes later, which Marcus approves.

---

## 3. User Stories & Acceptance Criteria

### US-1: Biometric App Locking
*   **Story**: As Diana (Admin), I want the mobile application to enforce biometric verification on every launch or session resumption, so that unauthorized users cannot access my local AI data if they bypass my phone lock screen.
*   **Acceptance Criteria**:
    *   App prompts for FaceID/TouchID/Biometric Prompt on launch.
    *   App blanks/blurs content in the multitasking screen.
    *   Biometric prompt activates if the app has been backgrounded for more than 30 seconds.
    *   After 3 failed biometric attempts, local cached databases are locked, requiring the master workspace QR code to repair.

### US-2: Detailed Model Swapping
*   **Story**: As Elena (AI Engineer), I want to swap models during a live chat session from my mobile device, so that I can compare token outputs and latency between models.
*   **Acceptance Criteria**:
    *   User can tap the model alias in the chat header.
    *   A bottom sheet lists all models loaded in VRAM, plus models available on disk.
    *   Selecting a model triggers the host (`LiteLLM` / `Ollama`) to load it.
    *   A status spinner shows the model loading progress (0-100%).
    *   The chat context is preserved and routed to the new model on the next token request.
