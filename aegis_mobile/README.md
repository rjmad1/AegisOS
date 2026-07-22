# Aegis Mobile Companion Application

The Aegis Mobile Companion is a Flutter-based mobile dashboard for AegisOS operators.

## Key Capabilities

- **Biometric Authentication:** Secure local access gating via device biometrics (Face ID / Fingerprint).
- **Workstation Telemetry:** Real-time WebSocket connection over Tailscale mesh VPN to monitor CPU, GPU, VRAM, and active job queues.
- **ECDSA Approval Nonces:** Remote authorization for high-risk operations and mission deployments.

## Directory Structure

- `lib/`: Flutter application components, state providers, and mTLS/Tailscale clients.
- `pubspec.yaml`: Flutter dependency declaration.
- `analysis_options.yaml`: Dart static analysis rules.
