import type { IPolicyService, PolicyDecision, IExecutionContext } from './types';
import { executionContextService } from './ExecutionContextService';

export type PolicyRule = {
  id: string;
  actionPattern: string | RegExp;
  resourcePattern?: string | RegExp;
  evaluate: (action: string, resource?: string, context?: IExecutionContext) => Partial<PolicyDecision> | null;
};

export class PolicyService implements IPolicyService {
  private rules: PolicyRule[] = [];

  registerRule(rule: PolicyRule): void {
    this.rules.push(rule);
  }

  clearRules(): void {
    this.rules = [];
  }

  private matchesPattern(pattern: string | RegExp | undefined, value: string | undefined): boolean {
    if (!pattern) return true; // No pattern means it matches everything
    if (!value) return false; // Pattern exists but value doesn't
    if (typeof pattern === 'string') {
      return pattern === '*' || pattern === value;
    }
    return pattern.test(value);
  }

  evaluate(action: string, resource?: string, context?: IExecutionContext): PolicyDecision {
    const start = performance.now();
    const ctx = context ?? executionContextService.current();

    for (const rule of this.rules) {
      if (this.matchesPattern(rule.actionPattern, action) && this.matchesPattern(rule.resourcePattern, resource)) {
        const result = rule.evaluate(action, resource, ctx);
        
        if (result) {
          return {
            action: result.action ?? 'deny',
            reason: result.reason ?? 'Matched policy rule',
            source: rule.id,
            durationMs: performance.now() - start,
            constraints: result.constraints
          };
        }
      }
    }

    // Default deny if no rules matched
    return {
      action: 'deny',
      reason: 'No matching policy found (Default Deny)',
      source: 'kernel:default',
      durationMs: performance.now() - start,
    };
  }

  async evaluateAsync(action: string, resource?: string, context?: IExecutionContext): Promise<PolicyDecision> {
    // In this synchronous engine, async just wraps the sync call. 
    // Real async evaluators (e.g. hitting a DB) could be supported in the future by adding async rules,
    // but the architecture prioritizes fast, in-process sync evaluation.
    return Promise.resolve(this.evaluate(action, resource, context));
  }
}

// Singleton export
export const policyService = new PolicyService();
