/**
 * ChaosSpec Schema Validator
 * 
 * Validates Chaos Specification descriptors (YAML/JSON) against 
 * defined schemas before execution.
 */

import type { ChaosSpec } from './types';

export class ChaosSpecValidator {
  /**
   * Validate that the object conforms to the ChaosSpec schema structure.
   */
  public static validate(spec: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!spec || typeof spec !== 'object') {
      return { isValid: false, errors: ['Specification is not a valid object.'] };
    }

    const requiredFields = ['id', 'version', 'name', 'category', 'steps', 'recoveryObjective'];
    for (const field of requiredFields) {
      if (!spec[field]) {
        errors.push(`Missing required field: "${field}"`);
      }
    }

    if (spec.steps && !Array.isArray(spec.steps)) {
      errors.push('"steps" must be an array of chaos actions.');
    } else if (spec.steps) {
      spec.steps.forEach((step: any, idx: number) => {
        if (!step.providerId || !step.action || !step.target) {
          errors.push(`Step [${idx}] is missing required fields (providerId, action, target).`);
        }
      });
    }

    if (spec.recoveryObjective) {
      if (typeof spec.recoveryObjective.rtoSeconds !== 'number') {
        errors.push('recoveryObjective.rtoSeconds must be a number.');
      }
      if (typeof spec.recoveryObjective.rpoSeconds !== 'number') {
        errors.push('recoveryObjective.rpoSeconds must be a number.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
