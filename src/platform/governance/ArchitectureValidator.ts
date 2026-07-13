// ============================================================================
// Architecture Validator — Fitness Checks and Dependency Governance
// ============================================================================

import { fitnessChecker, FitnessReport } from '../../infrastructure/governance/fitness-checks';
import { serviceRegistry } from '../kernel/ServiceRegistry';

export interface ArchitectureReport {
  timestamp: string;
  violationsFound: number;
  results: {
    rule: string;
    passed: boolean;
    details?: string[];
  }[];
  clean: boolean;
}

export class ArchitectureValidator {
  private static instance: ArchitectureValidator | null = null;

  private constructor() {}

  public static getInstance(): ArchitectureValidator {
    if (!ArchitectureValidator.instance) {
      ArchitectureValidator.instance = new ArchitectureValidator();
    }
    return ArchitectureValidator.instance;
  }

  /**
   * Run all architectural and dependency checks.
   */
  public validate(): ArchitectureReport {
    // 1. Run codebase-wide regex fitness checks
    const baseReport = fitnessChecker.runChecks();
    const results = [...baseReport.results];
    let violations = baseReport.violationsFound;

    // 2. Validate Service Registry Circular Dependencies
    let circularPassed = true;
    const circularDetails: string[] = [];
    try {
      serviceRegistry.verifyCircularity();
    } catch (err: any) {
      circularPassed = false;
      circularDetails.push(err.message);
      violations++;
    }

    results.push({
      rule: "Service Registry circular dependency check",
      passed: circularPassed,
      details: circularDetails.length > 0 ? circularDetails : undefined
    });

    return {
      timestamp: baseReport.timestamp,
      violationsFound: violations,
      results,
      clean: violations === 0
    };
  }
}

export const architectureValidator = ArchitectureValidator.getInstance();
export default architectureValidator;
