import { ResolvedParticipantDescriptor } from '../descriptors/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * DescriptorValidator
 * 
 * Validates fully resolved participant descriptors to ensure they meet
 * structural, security, and compatibility requirements before instantiation.
 */
export class DescriptorValidator {

  /**
   * Validates a participant descriptor.
   */
  public validate(descriptor: ResolvedParticipantDescriptor): ValidationResult {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    this.validateIdentity(descriptor, result);
    this.validateExtensions(descriptor, result);
    this.validateSecurity(descriptor, result);

    if (result.errors.length > 0) {
      result.valid = false;
    }

    return result;
  }

  private validateIdentity(descriptor: ResolvedParticipantDescriptor, result: ValidationResult): void {
    if (!descriptor.base.identity || !descriptor.base.identity.id) {
      result.errors.push('Missing participant identity ID.');
    }
    if (!descriptor.base.identity.type) {
      result.errors.push('Missing participant identity type.');
    }
  }

  private validateExtensions(descriptor: ResolvedParticipantDescriptor, result: ValidationResult): void {
    const requiredExts = descriptor.base.compatibility?.requiredExtensions || [];
    
    // Check that required extensions are present
    for (const reqExt of requiredExts) {
      const hasExt = descriptor.extensions.some(ext => ext.type === reqExt);
      if (!hasExt) {
        result.errors.push(`Missing required extension: ${reqExt}`);
      }
    }

    // Check for duplicate extensions
    const extTypes = new Set<string>();
    for (const ext of descriptor.extensions) {
      if (extTypes.has(ext.type)) {
        result.errors.push(`Duplicate extension type found: ${ext.type}`);
      }
      extTypes.add(ext.type);
    }
  }

  private validateSecurity(descriptor: ResolvedParticipantDescriptor, result: ValidationResult): void {
    if (descriptor.base.trustLevel === 'UNTRUSTED' && descriptor.base.sandbox?.filesystemAccess === 'READ_WRITE') {
      result.errors.push('UNTRUSTED participants cannot have READ_WRITE filesystem access.');
    }

    if (descriptor.base.security.requiresApprovalForDestructiveActions === false && descriptor.base.trustLevel !== 'SYSTEM') {
      result.warnings.push('Participant disables approval for destructive actions but is not a SYSTEM participant.');
    }
  }
}
