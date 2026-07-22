import { domainGovernanceLineage } from './DomainGovernanceLineage';

export interface DomainOntology {
  id: string;
  concepts: string[];
  relationships: Record<string, string[]>;
}

export class OntologyEngine {
  private static instance: OntologyEngine | null = null;
  private ontologies: Map<string, DomainOntology[]> = new Map();

  private constructor() {}

  public static getInstance(): OntologyEngine {
    if (!OntologyEngine.instance) {
      OntologyEngine.instance = new OntologyEngine();
    }
    return OntologyEngine.instance;
  }

  public registerDomainOntology(domain: string, ontology: DomainOntology): void {
    const existing = this.ontologies.get(domain) || [];
    existing.push(ontology);
    this.ontologies.set(domain, existing);
    
    domainGovernanceLineage.recordAction(domain, 'OntologyRegistered', {
      ontologyId: ontology.id
    });
  }

  public getDomainOntologies(domain: string): DomainOntology[] {
    return this.ontologies.get(domain) || [];
  }
}

export const ontologyEngine = OntologyEngine.getInstance();
