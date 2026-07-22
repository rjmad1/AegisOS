# AegisOS Knowledge Base: 18_SECURITY_REGISTER.md

## Security Architecture & Controls

### Zero-Trust Controls
* **Zero Telemetry Guarantee**: No external telemetry, tracking, or usage statistics are transmitted outside local workstation boundaries.
* **Executive Control Plane (ECP)**: Layer 5 stateless policy enforcers inspect and sanitize prompts/responses in real time.
* **Worker Thread VM Sandboxing**: Untrusted extensions run inside memory/CPU capped Node `worker_threads` with zero OS binding access.
* **Enterprise SAML 2.0 Identity**: Integrated `SamlProvider.ts` + `GroupClaimRoleMapper.ts` with HttpOnly JWT session tokens.
* **Mobile C2 Cryptographic Verification**: Remote operations require biometric ECDSA signature verification and nonce validation (ADR-013).
* **Release Manifest Signing**: Content-addressed Merkle-like integrity graphs signed with HMAC-SHA256.
