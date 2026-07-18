# AegisOS Studio Program (ASP)
## Module 06: Design System & Visual Language

> **Status**: APPROVED  
> **Authority**: AegisOS Design System Council  
> **Reference Document**: [00_Master_ASP_Framework.md](file:///d:/1_Projects/OpenClawOllamaLiteLLM_Transparency/docs/asp/00_Master_ASP_Framework.md)  

---

## 1. Visual Identity & Design Tenets

AegisOS Studio adopts a modern, high-contrast, premium dark-mode aesthetic (with full light mode support), characterized by glassmorphism accents, crisp typography, and dynamic micro-animations for real-time agent execution transparency.

---

## 2. Color Palette & UI Tokens

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AEGISOS STUDIO DESIGN TOKENS                              │
├─────────────────┬───────────────────┬──────────────────────────────────────────────────┤
│ Token Name      │ Hex Code / HSL    │ Usage / Semantics                                │
├─────────────────┼───────────────────┼──────────────────────────────────────────────────┤
│ `bg-primary`    │ `#0B0F19` / 222 38% 7%   │ Main background surface                      │
│ `bg-surface`    │ `#111827` / 220 39% 11%  │ Panel cards, sidebar surfaces                │
│ `bg-elevated`   │ `#1F2937` / 217 33% 17%  │ Modals, popovers, dropdowns                  │
│ `border-subtle` │ `#374151` / 217 19% 27%  │ Panel dividers, grid borders                 │
│ `accent-brand`  │ `#6366F1` / 239 84% 67%  │ Primary buttons, active tabs (Indigo)        │
│ `agent-active`  │ `#10B981` / 160 84% 39%  │ Running agent pulse glow (Emerald Green)     │
│ `agent-reason` │ `#8B5CF6` / 263 90% 66%  │ Agent reasoning stream trace (Purple)        │
│ `hitl-warning`  │ `#F59E0B` / 38 92% 50%   │ HITL Gate approval required (Amber)          │
│ `error-red`     │ `#EF4444` / 0 84% 60%    │ Failed step, critical alert                  │
│ `text-main`     │ `#F9FAFB` / 210 40% 98%  │ Primary text                                 │
│ `text-muted`    │ `#9CA3AF` / 215 16% 65%  │ Secondary labels, metadata                   │
└─────────────────┴───────────────────┴──────────────────────────────────────────────────┘
```

---

## 3. Typography Scale

- **UI Sans-Serif**: `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **Code & Monospace**: `JetBrains Mono`, `Fira Code`, `monospace`.

| Token | Font Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `display-lg` | 32px | 40px | 700 Bold | Workspace titles, Splash screen |
| `heading-md` | 20px | 28px | 600 SemiBold | Screen headers, Card titles |
| `body-md` | 14px | 20px | 400 Regular | Primary UI body text, lists |
| `body-sm` | 12px | 16px | 400 Regular | Metadata, tooltips, tags |
| `code-md` | 13px | 20px | 400 Regular | Code editor, live terminal stream |

---

## 4. Micro-Interactions & Animation Tokens

1. **Agent Thinking Pulse**:
   - `animation: agent-pulse 1.8s infinite ease-in-out;`
   - Subtle emerald glow ring around active agent nodes in the console.
2. **Streaming Text Scroll**:
   - Smooth auto-scroll behavior (`scroll-behavior: smooth`) locked to bottom during live agent reasoning output.
3. **HITL Alert Flash**:
   - Amber border pulse (`0px 0px 12px rgba(245, 158, 11, 0.5)`) indicating urgent human intervention needed.
4. **Perspective Shift Transition**:
   - 200ms cross-fade (`opacity 0.2s ease, transform 0.2s ease`) when switching between persona perspectives.
