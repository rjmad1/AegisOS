# AegisOS Ecosystem Contribution Guide

This guide establishes the rules and standards for contributing to the AegisOS Ecosystem (Provider Packs, Connectors, Missions, and Extensions) while maintaining strict alignment with the frozen Version 1 Architecture Baseline.

## Contribution Workflow
1. **Identify Extensibility Point**: Ensure your addition is implemented as an extension, provider, mission, or blueprint rather than a modification to the core platform layers, registries, kernels, and control planes.
2. **Implement Extension**: Package your files in the standard `.aegispack` zip structure including a valid `manifest.json`.
3. **Verify Compliance**: Scan your code using the Certification Scanner to verify sandbox constraints and signature verification.
4. **Obtain Signature**: Sign the manifest using an approved Ed25519 cryptographic key before submission.
5. **PR Submissions**: Pull Requests must include qualification reports and proof of passing all validation gates.

## Standard Coding Rules
- Strictly adhere to [CODING_STANDARDS.md](../CODING_STANDARDS.md) and [API_GUIDELINES.md](../API_GUIDELINES.md).
- Keep code modular, type-safe, and self-contained.
- Do not import core platform internal services directly; interact via standard extension contexts and contracts.
