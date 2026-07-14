# Figma Integration & Design-to-Code Guide

This guide establishes design token configurations, naming structures, and responsive grid layouts for designers working in Figma on AegisOS Mobile.

---

## 1. Token Variables Mapping

Figma styles must match the token structures in `TOKENS.json` exactly:

| Figma Variable Name | Json Color Path | Hex Value |
| :--- | :--- | :--- |
| `color/brand/background` | `colors.background` | `#060814` |
| `color/brand/surface` | `colors.surface` | `#0e1329` |
| `color/brand/primary` | `colors.primary` | `#6b5dff` |
| `color/brand/secondary` | `colors.secondary` | `#3df2ff` |
| `color/border/subtle` | `colors.border` | `#282d47` |
| `color/text/primary` | `colors.text.primary` | `#f5f7fa` |
| `color/text/muted` | `colors.text.muted` | `#9ca3af` |

---

## 2. Grid & Responsive Layout Frames

Designs must support the following viewport boundaries:

### 2.1 Compact Mobile Viewport (`390px x 844px`)
*   **Columns**: 4
*   **Gutter**: 16px
*   **Margins**: 16px

### 2.2 Expanded Tablet Viewport (`768px x 1024px`)
*   **Columns**: 8 or 12
*   **Gutter**: 24px
*   **Margins**: 32px
*   *Note*: Screen layout transitions from a bottom-tab navigation bar to an left-anchored Navigation Rail.

### 2.3 Foldable / Dual-Screen Viewport (`800px x 600px` - Hinge Aware)
*   **Layout Rule**: Define a 20px physical separator (hinge zone). Core features (chat on the left, telemetry chart on the right) must split along the hinge coordinate.

---

## 3. Export Configurations
*   **Icons**: SVG format, scale `1.0x`, outline/stroke rules.
*   **Illustrations**: WebP format for raster icons, high compression, resolution `3.0x` (retina).
*   **Lottie/Rive**: Interactive files placed in `assets/animations/` with explicit naming (e.g. `pairing_success.json`).
