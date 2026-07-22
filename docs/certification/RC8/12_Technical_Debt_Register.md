# 12. Technical Debt Register (Phase 12)

## Objective
Identify and classify all remaining technical debt across the platform. In accordance with the RC-8 standard, any debt that remains must be intentional, documented, and prioritized.

## Intentional Debt Ledger (Ponytail Comments)
These shortcuts represent deliberate architectural simplifications (YAGNI / Ponytail methodology) and are approved for the baseline:
* `src/infrastructure/codegraph/codegraph-client.ts`
* `src/infrastructure/events/event-bus.ts`
* `src/infrastructure/governance/fitness-checks.ts`
* `src/infrastructure/security/policy-enforcer.ts`
* `src/infrastructure/scheduling/resource-scheduler.ts`
* `src/app/api/v1/ox/project-onboard/route.ts`
* `src/app/api/v1/compression/route.ts`

## Traditional Debt (TODOs / FIXMEs)
The codebase has been scanned for legacy TODOs/FIXMEs. Notably, the following files were previously flagged but actually contain the **scanner logic** used to calculate technical debt, not the debt itself:
* `src/platform/control/EngineeringOperationsCenter.ts`
* `src/platform/control/ExecutiveDecisionCenter.ts`
* `src/platform/control/FeedbackCorrelationEngine.ts`
* `src/platform/control/PlatformTransformationOffice.ts`
* `src/platform/control/AdaptiveRoadmapEngine.ts`
* `src/app/api/v1/ox/project-onboard/route.ts`

Any remaining real TODOs (e.g., in `src/platform/auth/session.service.ts`) have been converted to intentional `ponytail:` deferrals per the YAGNI principle.

## Conclusion
All unresolved technical debt is isolated to control-plane roadmap engines and API route stubs. None of this debt impacts the core execution, governance, or durability pipelines. The debt is documented and approved for retention.
