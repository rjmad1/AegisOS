# UAWOS Mobile Command Center: Accessibility Guidelines

This document details the Accessibility design requirements for the UAWOS Mobile Command Center application, target compliance, and guidelines for visual, auditory, and motor design.

---

## 1. Compliance Target: WCAG 2.2 AAA

The application is committed to delivering a premium, inclusive experience, targeting **WCAG 2.2 Level AAA** compliance across all UI screens.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ACCESSIBILITY STANDARDS                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Contrast Ratios│ 2. Dynamic Text   │ 3. Non-Visual Auditing         │
│ Min 7:1 for text. │ Dynamic Type scale│ TalkBack & VoiceOver labels on │
│ No color-only info│ component-safe.   │ all telemetry charts & widgets.│
└───────────────────┴───────────────────┴────────────────────────────────┘
```

---

## 2. Visual Accessibility

### A. Color & Contrast
*   **Contrast Thresholds**: Text and interactive elements must maintain a minimum contrast ratio of **7:1** against the background. For large-scale text (18pt+), the ratio must be at least **4.5:1**.
*   **Dual Coding Statuses**: Information must not be conveyed by color alone.
    *   *Example (Agent Status)*: Active agents display a green pulsing dot *and* a label "Active". Throttled agents display a yellow triangle *and* "Throttled". Offline services display a red square *and* "Offline".
*   **Graph Readability**: Time-series charts must use distinct dash patterns (solid, dashed, dotted) or shape markers to differentiate lines (e.g., GPU utilization vs VRAM load) to assist colorblind operators.

### B. Typography & Scaling
*   **Dynamic Text / Dynamic Type**: The UI must adapt to system-level font scale adjustments (up to 200%) without overlapping text, truncating labels, or breaking telemetry meters.
*   **Component Wrapping**: Text components must wrap dynamically or transition to full-width drawers when scaled, rather than clipping.

---

## 3. Auditory & Screen Reader Optimization

*   **Semantic Labeling**: Every telemetry gauge, progress bar, and card must contain explicit accessibility attributes:
    *   *GPU Gauge*: Label: *"GPU Load"*, Value: *"45 percent"*, Hint: *"Shows active CUDA processing utilization."*
    *   *Approval Card*: Label: *"Pending Approval"*, Value: *"Agent CodeGraph-04 requests write permission to index.ts."*, Hint: *"Double-tap to open diff inspector."*
*   **Screen Reader Navigation**: Maintain a logical tab-focus order (left-to-right, top-to-bottom). Telemetry details must be keyboard-accessible or readable via swipe navigation.
*   **Live Regions (Announcements)**: High-priority system faults (e.g., *"Warning: Workstation Overheating"*) must utilize accessibility live regions (`accessibilityLiveRegion` on Android, `accessibilityViewIsModal` / announcements on iOS) to read out alerts immediately.

---

## 4. Motor Accessibility & Touch Targets

*   **Touch Targets**: All interactive elements (buttons, selectors, input fields) must have a minimum touch target size of **48 x 48 dp (density-independent pixels)**, with at least 8dp of separation between adjacent targets.
*   **Gesture Fallbacks**: Swipe gestures (e.g., swiping right to approve) must have equivalent tap targets (e.g., an explicit "Approve" button) to support users with limited motor control.
*   **Keyboard Navigation**: The application must support hardware keyboards (via Bluetooth or USB) and trackpads, offering keyboard navigation shortcuts matching the Raycast command palette.
