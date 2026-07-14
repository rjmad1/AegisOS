# Custom Component Specifications: Flutter Widgets

This document specifies the APIs, properties, accessibility considerations, and verification procedures for the core reusable widgets of AegisOS Mobile.

---

## 1. Primary Action Button (`AegisButton`)

*   **API / Constructor**:
    ```dart
    const AegisButton({
      Key? key,
      required String label,
      required VoidCallback? onPressed,
      AegisButtonVariant variant = AegisButtonVariant.primary,
      bool isLoading = false,
      IconData? icon,
    });
    ```
*   **Props**:
    *   `label`: Display string.
    *   `onPressed`: Callback trigger. If `null`, button renders in a disabled state.
    *   `variant`: `primary`, `secondary`, `destructive`, `warning`.
    *   `isLoading`: Displays a centered progress spinner overlay.
*   **Accessibility**:
    *   Explicit `Semantics` wrapper with `label` override.
    *   Applies button trait flags: `isButton: true`, `isEnabled: onPressed != null`.
*   **Verification Strategy**:
    *   *Unit test*: Verify that tap events trigger callbacks.
    *   *Widget test*: Validate that progress spinner replaces text when `isLoading` is set to true.

---

## 2. Interactive Info Card (`AegisCard`)

*   **API / Constructor**:
    ```dart
    const AegisCard({
      Key? key,
      required Widget child,
      VoidCallback? onTap,
      double? height,
      bool isGlass = true,
    });
    ```
*   **Props**:
    *   `child`: Child widget layout.
    *   `onTap`: Interactive callback. If provided, enables ripple click effects.
    *   `isGlass`: Toggles the backdrop filter blur overlay.
*   **Accessibility**:
    *   Focus boundary traversal node.
*   **Verification Strategy**:
    *   *Golden test*: Match rendering under light/dark frames.

---

## 3. Real-Time Log Console (`LogTerminalView`)

*   **API / Constructor**:
    ```dart
    const LogTerminalView({
      Key? key,
      required Stream<String> logStream,
      bool autoScroll = true,
      VoidCallback? onCopyAll,
    });
    ```
*   **Props**:
    *   `logStream`: Async stream of incoming string log lines.
    *   `autoScroll`: Forces terminal view to snap to the latest line.
*   **Aesthetics**: Monospace font, high contrast black-charcoal canvas.
*   **Accessibility**:
    *   Mark as container boundary for screen readers. Enable line-by-line reading mode.
*   **Verification Strategy**:
    *   *Widget test*: Feed a mock stream of logs and confirm scrolling behavior is triggered.

---

## 4. Telemetry Graph (`TelemetryChart`)

*   **API / Constructor**:
    ```dart
    const TelemetryChart({
      Key? key,
      required List<FlSpot> points,
      required String label,
      required Color color,
      double minVal = 0,
      double maxVal = 100,
    });
    ```
*   **Props**:
    *   `points`: Coordinate spots plotting metrics history.
    *   `label`: Metric tag (e.g. CPU).
    *   `color`: Chart line fill.
*   **Verification Strategy**:
    *   *Golden test*: Ensure curves match coordinates.
