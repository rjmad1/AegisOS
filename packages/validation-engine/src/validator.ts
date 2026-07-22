import { ValidationReport, ValidationFailure } from '@platform/shared-contracts';

export interface IValidator {
  name: string;
  validate(context: {
    nodeId: string;
    domSnapshot?: string;
    consoleLogs?: Array<{ type: string; text: string }>;
    networkErrors?: Array<{ url: string; status: number }>;
  }): Promise<ValidationFailure[]>;
}

export class ConsoleErrorValidator implements IValidator {
  name = 'console-error';

  async validate(context: {
    nodeId: string;
    consoleLogs?: Array<{ type: string; text: string }>;
  }): Promise<ValidationFailure[]> {
    const failures: ValidationFailure[] = [];
    if (!context.consoleLogs) return failures;

    for (const log of context.consoleLogs) {
      if (log.type === 'error') {
        failures.push({
          validator: 'console-error',
          severity: 'moderate',
          summary: `Unhandled browser console error: ${log.text.slice(0, 100)}`,
          rawOutput: { logText: log.text },
        });
      }
    }

    return failures;
  }
}

export class AccessibilityValidator implements IValidator {
  name = 'axe-core';

  async validate(context: {
    nodeId: string;
    domSnapshot?: string;
  }): Promise<ValidationFailure[]> {
    const failures: ValidationFailure[] = [];
    if (!context.domSnapshot) return failures;

    // Check for images without alt attributes
    const imgMissingAltRegex = /<img(?![^>]*\balt=)[^>]*>/gi;
    const matches = context.domSnapshot.match(imgMissingAltRegex);

    if (matches && matches.length > 0) {
      failures.push({
        validator: 'axe-core',
        severity: 'minor',
        summary: `Found ${matches.length} <img> tag(s) missing alt attribute`,
        rawOutput: { missingAltCount: matches.length, sampleMatch: matches[0] },
      });
    }

    return failures;
  }
}

export class ValidationPipeline {
  private validators: IValidator[] = [
    new ConsoleErrorValidator(),
    new AccessibilityValidator(),
  ];

  async runSuite(context: {
    nodeId: string;
    domSnapshot?: string;
    consoleLogs?: Array<{ type: string; text: string }>;
    networkErrors?: Array<{ url: string; status: number }>;
  }): Promise<ValidationReport> {
    const violations: ValidationFailure[] = [];

    for (const validator of this.validators) {
      try {
        const results = await validator.validate(context);
        violations.push(...results);
      } catch (err: any) {
        violations.push({
          validator: 'console-error',
          severity: 'minor',
          summary: `Validator ${validator.name} threw error: ${err.message}`,
          rawOutput: { error: String(err) },
        });
      }
    }

    return {
      nodeId: context.nodeId,
      passed: violations.length === 0,
      violations,
    };
  }
}
