# AegisOS Maintainer Guide

This document defines the roles, responsibilities, and operational procedures for AegisOS Ecosystem Maintainers.

## Release Management & Gates
- **Architecture Freeze**: Maintainers must reject any pull request attempting to add new kernels, managers, or foundational primitives to the core baseline without a constitutional review and signed ADR.
- **Contract-First Verification**: Ensure public contracts and API routes are defined and versioned before merging corresponding implementation details.
- **Quality Gates Check**: Every pull request must pass the automated Qualification Framework (PQF), unit tests, integration tests, performance budgets, and security scans.

## Pull Request Review Checklist
- [ ] Compiles with zero warnings.
- [ ] Manifest signature and trust verification check.
- [ ] No direct process/shell executions (Sandbox verification).
- [ ] Up-to-date documentation and ADR links.
- [ ] 100% compliance score in the Governance Compliance Matrix.
