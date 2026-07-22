# AegisOS Plugin Certification Guide

This document standardizes the certification rules and procedures for third-party extensions, provider packs, and connectors.

## Package Manifest Specification (MMS)
Every published package must contain a `manifest.json` at the root specifying:
- `id`: Unique namespace string (e.g. `com.company.extension`).
- `version`: Semantic versioning format.
- `capabilities`: Core functionalities exposed to registries.
- `permissions`: Declared access rights (e.g. `event-subscribe`, `event-publish`).
- `signature`: Ed25519 digital signature.

## Certification Scans
Before installation, packages undergo four checks:
1. **Signature Verification**: Validates manifest digital signature.
2. **Sandbox Isolation**: Disallows `child_process` and direct filesystem mutations.
3. **API Contract Compatibility**: Ensures compliance with platform semantic versions.
4. **Dependency Resolution**: Checks availability and version matching of nested packages.
