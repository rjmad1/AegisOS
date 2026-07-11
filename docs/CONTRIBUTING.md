# Contributing to AI Workstation

Thank you for your interest in contributing to the AI Workstation platform!

## Code of Conduct
Please help us maintain a friendly, cooperative environment by being respectful to team members.

## Development Workflow
1. **Branching**: Create a feature branch from the `main` branch.
2. **Conventions**:
   - For Console frontend updates, write code in the `src/` directory. Ensure TypeScript compilation passes (`npm run build`).
   - For Automation script changes, write code in the `automation/` directory. Import `PlatformHelper.psm1` for logging and elevation checks.
3. **Architecture Decision Records**: If your changes introduce a new architectural pattern or break an existing behavior, submit a new ADR under `adr/` following the numbered naming sequence (e.g. `ADR-009-some-feature.md`).
4. **Testing**: Run the validation checks using `automation/Validate.ps1` before committing.
5. **PR Submission**: Open a Pull Request referencing the task/issue. Ensure CI validation passes.
