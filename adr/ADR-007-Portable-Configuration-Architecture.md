# ADR-007: Portable Configuration Architecture

## Status
Approved

## Context
The platform configurations contained hardcoded absolute drive references (`D:\OpenClaw`, `C:\LiteLLM`, etc.) and hardcoded user profiles (e.g. `C:\Users\rjkum\.openclaw`), which prevented deploying the workstation on different drives, usernames, or machine architectures.

## Decision
Decouple and externalize all path calculations:
1. **Dynamic Platform Root**: Enforce the use of a base environment parameter `$PlatformRoot` (resolves default, environment, or command argument).
2. **Dynamic User Directories**: Use environment-defined paths (e.g. `$env:USERPROFILE` or `[System.Environment]::GetFolderPath("UserProfile")`) instead of hardcoded username prefixes.
3. **Registry Redirection**: Parameterize NSSM paths in registry keys relative to the dynamic root resolved during configure/migration time.
4. **Decoupled Secrets**: Scoped credentials (tokens) are stored inside the platform secrets directory, DPAPI-encrypted via machine scope. On machine migration (e.g., when the DPAPI encryption key changes), the restore system automatically prompts for credential re-entry and re-encrypts keys, rather than hard-failing or checking in plain files.
5. **No drive letter locks**: The path translation and rewrite pipeline in `automation/Migrate.ps1` dynamically replaces drive variables.

## Alternatives Considered
- **Direct config check-in**: Rejected since it exposes secrets and locks users to specific drives.
- **Config database table**: Over-complicated; JSON/YAML profiles are easier to distribute and maintain.

## Trade-offs
- *Pros*: Completely drive-agnostic; clean credential segregation; support for multiple environments.
- *Cons*: Restores require interactive prompts if DPAPI keys mismatch.

## Consequences
- The platform can be migrated, backed up, and restored across arbitrary machines and letters.
- Credentials are never check-in or shared.
