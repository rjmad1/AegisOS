import {
  UniversalExecutionDescriptor,
  ParticipantExtension,
  ResolvedParticipantDescriptor,
  ExtensionType
} from '../descriptors/types';

/**
 * DescriptorCompositionEngine
 * 
 * Responsible for merging a base Universal Execution Descriptor (UED) with
 * various Participant Extensions to produce a fully resolved participant descriptor.
 * 
 * Future implementations will support merging template defaults with mission overrides.
 */
export class DescriptorCompositionEngine {
  
  /**
   * Composes a base descriptor with one or more extensions.
   * 
   * @param base The Universal Execution Descriptor.
   * @param extensions An array of extensions (e.g., CognitiveDescriptor).
   * @returns A ResolvedParticipantDescriptor containing both execution and extension logic.
   */
  public compose(
    base: UniversalExecutionDescriptor,
    extensions: ParticipantExtension[]
  ): ResolvedParticipantDescriptor {
    
    // Ensure no duplicate extension types are attached
    const extensionTypes = new Set<ExtensionType>();
    
    for (const ext of extensions) {
      if (extensionTypes.has(ext.type)) {
        throw new Error(`Participant composition failed: Duplicate extension type '${ext.type}' found.`);
      }
      extensionTypes.add(ext.type);
    }

    return {
      base: { ...base }, // Deep copy or structure clone in a real implementation
      extensions: [...extensions]
    };
  }

  /**
   * Helper to extract a specific extension from a resolved descriptor.
   */
  public static getExtension<T extends ParticipantExtension>(
    descriptor: ResolvedParticipantDescriptor,
    type: ExtensionType
  ): T | undefined {
    return descriptor.extensions.find(ext => ext.type === type) as T | undefined;
  }
}
