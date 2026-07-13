# Enterprise Release Governance Framework

| Field | Value |
|---|---|
| **Document ID** | ERG-2026-001 |
| **Version** | 1.0.0 |
| **Date** | 2026-07-13 |
| **Classification** | Public — Operations Policy |
| **Owner** | Enterprise Release Train Engineer / Chief Product Officer |

---

## 1. Versioning Strategy (SemVer)
The platform follows Semantic Versioning 2.0.0 (SemVer) with format \`MAJOR.MINOR.PATCH\`:
- **MAJOR**: Breaking changes to API contracts or structural requirements.
- **MINOR**: Backward-compatible feature additions (e.g., new providers).
- **PATCH**: Backward-compatible bug fixes and security hotfixes.

## 2. Release Branching Model
- **\`main\`**: Production-ready GA code. Every merge to \`main\` represents a tagged release.
- **\`release/vX.Y\`**: Dedicated release branch for stabilization, testing, and patch cherry-picks.
- **\`hotfix/vX.Y.Z\`**: Temporary branch to resolve urgent production vulnerabilities. Merged to \`main\` and cherry-picked to active release branches.

## 3. Long-Term Support (LTS) Strategy
- **LTS Releases**: Every even-numbered MINOR release (e.g., v1.0.0, v1.2.0) is designated an LTS release.
- **LTS Lifecycle**: Supported for **24 months** from GA date:
  - **Active Support (Months 1-12)**: Bug fixes, performance improvements, security patches, minor enhancements.
  - **Maintenance Support (Months 13-24)**: Critical bug fixes and high/critical security patches only.
- **LTS Upgrade Path**: Direct upgrades are supported between consecutive LTS releases (e.g., v1.0.x directly to v1.2.x).

## 4. Hotfix & Emergency Release Process
1. **Trigger**: High or Critical vulnerability reported (CVSS >= 7.0) or production blocker.
2. **Branching**: Branch created from the corresponding release tag (\`hotfix/vX.Y.Z\`).
3. **Remediation**: Principal Software Engineer applies fix.
4. **Validation**: Test suite (\`npx vitest\`) and Security Scan (\`node scripts/release-validation-suite.js\`) run with clean outcomes.
5. **Approval**: Tri-party approval required (Release Manager, SRE Lead, Security Lead) before build release.
6. **Deployment**: Release published with PATCH increment, bypassing standard 2-week validation windows.

## 5. Deprecation Policy
- **Notice Period**: Deprecation warnings must be announced **one minor release in advance** (e.g., deprecated in v1.1.0, removed in v1.2.0).
- **API Warnings**: Deprecated API endpoints must return an \`X-API-Deprecation-Date\` header and log SRE telemetry warnings.

## 6. Security Patch Lifecycle
- **Critical Vulnerabilities**: Resolved and patch released within **48 hours**.
- **High Vulnerabilities**: Resolved and patch released within **7 days**.
- **Medium/Low Vulnerabilities**: Bundled into standard monthly patch cycles.
