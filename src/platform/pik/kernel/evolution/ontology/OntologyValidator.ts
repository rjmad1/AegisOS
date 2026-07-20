// src/platform/pik/kernel/evolution/ontology/OntologyValidator.ts

export const PLATFORM_ENTITIES = [
  'system',
  'subsystem',
  'component',
  'provider',
  'registry',
  'service',
  'api',
  'contract',
  'database',
  'workflow',
  'capability',
  'agent',
  'model',
  'policy',
  'test',
  'documentation',
  'adr',
  'diagram',
  'code'
] as const;

export type PlatformEntityType = typeof PLATFORM_ENTITIES[number];

export const PLATFORM_RELATIONSHIPS = [
  'implements',
  'depends_on',
  'validates',
  'documents',
  'governs',
  'certifies',
  'supports',
  'executes',
  'references',
  'related_to',
  'supersedes'
] as const;

export type PlatformRelationshipType = typeof PLATFORM_RELATIONSHIPS[number];

export interface OntologyRule {
  type: PlatformRelationshipType;
  validSources: PlatformEntityType[];
  validTargets: PlatformEntityType[];
}

export class OntologyValidator {
  private static instance: OntologyValidator | null = null;

  private rules: Map<PlatformRelationshipType, OntologyRule> = new Map();

  private constructor() {
    this.initializeRules();
  }

  public static getInstance(): OntologyValidator {
    if (!OntologyValidator.instance) {
      OntologyValidator.instance = new OntologyValidator();
    }
    return OntologyValidator.instance;
  }

  private initializeRules(): void {
    this.rules.set('implements', {
      type: 'implements',
      validSources: ['component', 'service', 'provider', 'code'],
      validTargets: ['contract', 'api', 'capability']
    });

    this.rules.set('depends_on', {
      type: 'depends_on',
      validSources: ['system', 'subsystem', 'component', 'service', 'workflow', 'code', 'agent', 'model'],
      validTargets: ['system', 'subsystem', 'component', 'service', 'database', 'code', 'provider']
    });

    this.rules.set('validates', {
      type: 'validates',
      validSources: ['test'],
      validTargets: ['code', 'component', 'service', 'api', 'contract', 'workflow', 'capability', 'policy']
    });

    this.rules.set('documents', {
      type: 'documents',
      validSources: ['documentation', 'adr', 'diagram'],
      validTargets: ['system', 'subsystem', 'component', 'service', 'api', 'contract', 'code', 'workflow', 'capability']
    });

    this.rules.set('governs', {
      type: 'governs',
      validSources: ['policy', 'adr'],
      validTargets: ['system', 'subsystem', 'component', 'service', 'code', 'workflow', 'capability', 'agent', 'model']
    });

    this.rules.set('certifies', {
      type: 'certifies',
      validSources: ['policy', 'test'],
      validTargets: ['capability', 'component', 'service']
    });

    this.rules.set('supports', {
      type: 'supports',
      validSources: ['documentation', 'service', 'component', 'code'],
      validTargets: ['capability', 'workflow']
    });

    this.rules.set('executes', {
      type: 'executes',
      validSources: ['workflow', 'service', 'agent', 'component'],
      validTargets: ['api', 'service', 'component', 'code']
    });

    this.rules.set('references', {
      type: 'references',
      validSources: ['adr', 'documentation', 'code', 'test'],
      validTargets: ['adr', 'documentation', 'code', 'test', 'policy']
    });

    this.rules.set('supersedes', {
      type: 'supersedes',
      validSources: ['adr', 'policy', 'documentation', 'code'],
      validTargets: ['adr', 'policy', 'documentation', 'code']
    });
  }

  /**
   * Validates if a node type is defined in the platform ontology.
   */
  public isValidEntityType(type: string): boolean {
    return PLATFORM_ENTITIES.includes(type as PlatformEntityType);
  }

  /**
   * Validates if a relationship satisfies ontology constraints.
   */
  public validateRelationship(
    sourceType: string,
    targetType: string,
    relationship: string
  ): { isValid: boolean; error?: string } {
    const relType = relationship.toLowerCase() as PlatformRelationshipType;
    
    if (!PLATFORM_RELATIONSHIPS.includes(relType)) {
      return {
        isValid: false,
        error: `Invalid relationship type: '${relationship}'. Valid types are: [${PLATFORM_RELATIONSHIPS.join(', ')}]`
      };
    }

    const rule = this.rules.get(relType);
    if (!rule) return { isValid: true };

    const src = sourceType.toLowerCase() as PlatformEntityType;
    const tgt = targetType.toLowerCase() as PlatformEntityType;

    if (!rule.validSources.includes(src)) {
      return {
        isValid: false,
        error: `Ontology Violation: Relationship '${relationship}' cannot originate from entity type '${sourceType}'. Valid source types: [${rule.validSources.join(', ')}]`
      };
    }

    if (!rule.validTargets.includes(tgt)) {
      return {
        isValid: false,
        error: `Ontology Violation: Relationship '${relationship}' cannot target entity type '${targetType}'. Valid target types: [${rule.validTargets.join(', ')}]`
      };
    }

    return { isValid: true };
  }
}

export const ontologyValidator = OntologyValidator.getInstance();
export default ontologyValidator;
