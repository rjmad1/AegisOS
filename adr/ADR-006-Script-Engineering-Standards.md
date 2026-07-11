# ADR-006: Script Engineering Standards

## Status
Approved

## Context
Existing scripts under `Deployment/` and `DisasterRecovery/` contained duplicate helper logging functions, redundant elevation checks, and inconsistent exit code definitions. They lacked uniform headers and comment-based help structures.

## Decision
Establish and enforce a strict PowerShell script engineering standard:
1. **Shared Helper Module**: Introduce `automation/libs/PlatformHelper.psm1` to centralize logging (`Log-PlatformInfo`, `Log-PlatformSuccess`, etc.), privilege check (`Test-PlatformElevation`), and secret DPAPI protection.
2. **Comment-Based Help**: Every script must start with a standardized header block containing:
   ```powershell
   <#
   .SYNOPSIS
       Description of the script.
   .PARAMETER PlatformRoot
       Target platform base directory.
   .EXAMPLE
       .\automation\Install.ps1 -PlatformRoot "D:\AIPlatform"
   #>
   ```
3. **Explicit Parameter Blocks**: Declare strict parameter mappings with validation wrappers.
4. **Consistent Exit Codes**: Return `0` on successful completion and `1` on failure, allowing calling processes (like CI/CD or orchestrators) to react.
5. **Idempotency**: All operations (creating directories, copying files, stopping/starting services) must be safe to execute multiple times.

## Alternatives Considered
- **Keep standalone scripts**: Rejected due to maintenance overhead when changing logging styles or paths.
- **Write custom cmdlets in C#**: Rejects due to increased compilation complexity and dependency on binary builds.

## Trade-offs
- *Pros*: Uniform console outputs; clean code reuse; reliable script chaining.
- *Cons*: Scripts must import `PlatformHelper.psm1` before calling logging commands.

## Consequences
- Reduces script line count by ~30% through helper deduplication.
- Logs and error outputs conform to standard platform formats.
