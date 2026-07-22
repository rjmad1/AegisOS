import { marketplaceService } from '../marketplace/MarketplaceService';
import { ontologyEngine } from './OntologyEngine';
import { knowledgePackLoader } from './KnowledgePackLoader';
import { domainMissionOrchestrator } from './DomainMissionOrchestrator';
import { domainGovernanceLineage } from './DomainGovernanceLineage';
import { executiveCockpitAdapter } from './ExecutiveCockpitAdapter';

export interface SolutionPackManifest {
  id: string;
  name: string;
  version: string;
  domain: string;
  description: string;
  author: string;
  signature: string;
  ontologies?: any[];
  knowledgeGraphs?: any[];
  missions?: any[];
  policies?: any[];
  connectors?: any[];
  reports?: any[];
}

export class SolutionPackService {
  private static instance: SolutionPackService | null = null;
  private installedPacks: Map<string, SolutionPackManifest> = new Map();

  private constructor() {}

  public static getInstance(): SolutionPackService {
    if (!SolutionPackService.instance) {
      SolutionPackService.instance = new SolutionPackService();
    }
    return SolutionPackService.instance;
  }

  public async installPack(manifest: SolutionPackManifest, bundleBuffer?: Buffer): Promise<boolean> {
    try {
      // 1. Publish to Marketplace as 'solution-pack'
      const marketplaceManifest = {
        ...manifest,
        type: 'solution-pack',
        capabilities: ['domain-awareness', manifest.domain]
      };
      
      const publishResult = await marketplaceService.publish(marketplaceManifest, manifest.signature, bundleBuffer);
      if (!publishResult.success) {
        throw new Error('Failed to publish solution pack to marketplace');
      }

      // 2. Load Ontologies via OntologyEngine
      if (manifest.ontologies && manifest.ontologies.length > 0) {
        for (const ontology of manifest.ontologies) {
          ontologyEngine.registerDomainOntology(manifest.domain, ontology);
        }
      }

      // 3. Load Knowledge Packs
      if (manifest.knowledgeGraphs && manifest.knowledgeGraphs.length > 0) {
        for (const kg of manifest.knowledgeGraphs) {
          knowledgePackLoader.loadKnowledgePack(manifest.domain, kg);
        }
      }

      // 4. Register Domain Missions
      if (manifest.missions && manifest.missions.length > 0) {
        for (const mission of manifest.missions) {
          domainMissionOrchestrator.registerDomainMission(manifest.domain, mission);
        }
      }

      // 5. Register Reports
      if (manifest.reports && manifest.reports.length > 0) {
        for (const report of manifest.reports) {
          executiveCockpitAdapter.registerDomainReport(manifest.domain, report);
        }
      }

      // 6. Audit Installation
      domainGovernanceLineage.recordAction(manifest.domain, 'SolutionPackInstallation', {
        packId: manifest.id,
        version: manifest.version
      });

      this.installedPacks.set(manifest.id, manifest);
      return true;
    } catch (err) {
      console.error(`Error installing solution pack ${manifest.id}:`, err);
      return false;
    }
  }

  public getInstalledPacks(): SolutionPackManifest[] {
    return Array.from(this.installedPacks.values());
  }

  public getPack(id: string): SolutionPackManifest | undefined {
    return this.installedPacks.get(id);
  }
}

export const solutionPackService = SolutionPackService.getInstance();
