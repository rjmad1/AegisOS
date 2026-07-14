# Design System: AegisOS Mobile UX Language

AegisOS Mobile utilizes a premium, state-of-the-art Material 3 design system customized with a Slate-Indigo palette, glassmorphic textures, and micro-animations designed for technical operators.

---

## 1. Visual Aesthetics & Theme Core
*   **Vibe**: Sleek, immersive dark-first command center. Focuses on information density, structural hierarchy, and responsive fluid motion.
*   **Design Paradigm**: Glassmorphism (`BackdropFilter` overlays with subtle borders), curated color harmonies, and high contrast status indicators (WCAG 2.2 AAA standard).

---

## 2. Color System: Slate-Indigo Palette

We define dark-first color tokens based on the HSL space to ensure color harmony and precise contrast calculations.

### Dark Theme Palette
*   **Background (Canvas)**: `HSL(222, 47%, 4%)` (Deep Space Obsidian)
*   **Surface (Cards/Panels)**: `HSL(222, 47%, 9%)` (Slate Charcoal)
*   **Surface Glow**: `HSL(222, 47%, 14%)` (Hover/Active elements)
*   **Primary (Brand/Interactive)**: `HSL(250, 95%, 70%)` (Electric Neon Indigo)
*   **Secondary (Accents)**: `HSL(190, 90%, 60%)` (Cyber Cyan)
*   **Border / Outline**: `HSL(222, 20%, 20%)` (Subtle boundary)
*   **Text (Primary)**: `HSL(210, 40%, 98%)` (High-contrast frost white)
*   **Text (Muted/Secondary)**: `HSL(215, 20%, 65%)` (Cool grey)

### Status Semantic Colors
*   **Success (Low Risk)**: `HSL(145, 80%, 45%)` (Emerald Green)
*   **Warning (Medium Risk)**: `HSL(38, 90%, 55%)` (Neon Amber)
*   **Danger (High Risk)**: `HSL(0, 85%, 55%)` (Alizarin Red)
*   **Critical Risk (HITL)**: `HSL(300, 90%, 60%)` (Cyber Magenta)

---

## 3. Typography: Outfit & JetBrains Mono

We enforce standard scale sizes for readable content layout:

| Token Name | Font Family | Size (sp) | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `displayLarge` | Outfit | 36 | 700 (Bold) | 44 | -0.5 |
| `titleMedium` | Outfit | 20 | 600 (SemiBold) | 26 | 0.1 |
| `bodyMedium` | Outfit | 16 | 400 (Regular) | 22 | 0.0 |
| `bodySmall` | Outfit | 14 | 400 (Regular) | 18 | 0.2 |
| `codeNormal` | JetBrains Mono | 14 | 500 (Medium) | 20 | -0.1 |
| `codeSmall` | JetBrains Mono | 12 | 400 (Regular) | 16 | -0.2 |

---

## 4. Spacing & Elevation Grid

Spacing tokens are based on an 8dp baseline grid to maintain structural alignment:
*   `space_xxs`: 4dp
*   `space_xs`: 8dp
*   `space_sm`: 12dp
*   `space_md`: 16dp
*   `space_lg`: 24dp
*   `space_xl`: 32dp
*   `space_xxl`: 48dp

### Elevation & Glassmorphism Surfaces
*   **Elevation 0**: Primary canvas background.
*   **Elevation 1 (Cards)**: HSL surface background + 1dp border at 10% opacity, 12dp blur radius.
*   **Elevation 2 (Modals/Dialogs)**: Glassmorphic panel overlay (`BackdropFilter` with 15px sigma blur, HSL canvas overlay at 60% opacity, 1.5dp border).

---

## 5. Motion, Curves & Micro-Animations

All UI state transitions utilize custom Bézier easing curves rather than linear animation to feel responsive and natural:

*   **Easing Curve**: `cubic-bezier(0.16, 1, 0.3, 1)` (Ultra-fast, decelerating easeOut)
*   **Timing Coefficients**:
    *   *Micro-interactions (button tap, icon hover)*: **150ms**.
    *   *Transitions (card expansion, tab switch)*: **250ms**.
    *   *Page entry (dashboard load, screen routing)*: **350ms**.
*   **Haptic Triggers**:
    *   Tap success: Light feedback impulse.
    *   Approval success: Dual heavy-tap impulses.
    *   Error/Warning: Rapid triple vibration pulse.

---

## 6. Accessibility & Localization Targets
*   **Contrast Bounds**: Main text-to-background contrast ratio holds at `7.1:1` minimum (exceeding WCAG 2.2 AAA).
*   **Dynamic Scaling**: All sizes use scalable pixels (`sp`). UI layouts support dynamic text scaling up to 200% without clipping.
*   **Interactive Target Size**: Min touch target size is `48dp x 48dp` for all buttons, links, and checkboxes.
*   **Screen Readers**: Every widget includes semantic parameters (`Semantics` in Flutter) providing descriptive text overrides.
