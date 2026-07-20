// src/platform/pik/kernel/evolution/correlation/CorrelationEngine.ts
import * as path from 'path';
import { CanonicalAsset } from '../providers/types';
import { AdvancedRelationship } from '@/types/knowledge-fabric';
import { ontologyValidator } from '../ontology/OntologyValidator';

export class CorrelationEngine {
  private static instance: CorrelationEngine | null = null;

  private constructor() {}

  public static getInstance(): CorrelationEngine {
    if (!CorrelationEngine.instance) {
      CorrelationEngine.instance = new CorrelationEngine();
    }
    return CorrelationEngine.instance;
  }

  /**
   * Correlates discovered assets to infer semantic relationships between them.
   */
  public correlate(assets: CanonicalAsset[]): AdvancedRelationship[] {
    const relationships: AdvancedRelationship[] = [];
    const assetMap = new Map<string, CanonicalAsset>();
    assets.forEach(a => assetMap.set(a.id, a));

    // 1. Core Code-to-Code dependencies from imports
    assets.filter(a => a.type === 'code').forEach(codeAsset => {
      const imports = (codeAsset.properties.imports as string[]) || [];
      imports.forEach(imp => {
        // Resolve alias or relative imports
        const targetAsset = this.findImportTarget(imp, codeAsset.properties.path, assets);
        if (targetAsset && targetAsset.id !== codeAsset.id) {
          this.addRelationIfValid(relationships, codeAsset, targetAsset, 'depends_on', 'Static import analysis');
        }
      });
    });

    // 2. Test-to-Code validation mapping
    assets.filter(a => a.type === 'test').forEach(testAsset => {
      const targetPath = testAsset.properties.validatesCodeFile as string | null;
      if (targetPath) {
        const targetAsset = assets.find(a => a.id === `code:${targetPath}`);
        if (targetAsset) {
          this.addRelationIfValid(relationships, testAsset, targetAsset, 'validates', 'Test targets analysis');
        }
      }
    });

    // 3. ADR supersession and governance mapping
    const adrAssets = assets.filter(a => a.type === 'adr');
    adrAssets.forEach(adr => {
      // Supersedes ADR mapping
      const supersededCodes = (adr.properties.supersedes as string[]) || [];
      supersededCodes.forEach(code => {
        const targetAdr = adrAssets.find(a => a.id.toLowerCase().includes(code.toLowerCase()));
        if (targetAdr) {
          this.addRelationIfValid(relationships, adr, targetAdr, 'supersedes', 'ADR supersedes tag');
        }
      });

      // ADR governs code files (search if ADR description/context mentions code file name)
      const content = `${adr.properties.context} ${adr.properties.decision}`;
      assets.filter(a => a.type === 'code').forEach(code => {
        const basename = code.label.replace('.ts', '').replace('.tsx', '');
        if (content.includes(basename)) {
          this.addRelationIfValid(relationships, adr, code, 'governs', 'ADR text mention');
        }
      });
    });

    // 4. Workflow dependency mapping
    assets.filter(a => a.type === 'workflow').forEach(wf => {
      const capIds = (wf.properties.capabilities as string[]) || [];
      capIds.forEach(capId => {
        const capNode = assets.find(a => a.type === 'capability' && a.id.includes(capId));
        if (capNode) {
          this.addRelationIfValid(relationships, wf, capNode, 'depends_on', 'Workflow capabilities dependency');
        }
      });
    });

    // 5. Code implements Capability mapping
    assets.filter(a => a.type === 'code').forEach(code => {
      const pathLower = code.properties.path.toLowerCase();
      assets.filter(a => a.type === 'capability').forEach(cap => {
        const capIdLower = cap.properties.capabilityId?.toLowerCase();
        if (capIdLower && pathLower.includes(`/${capIdLower}/`)) {
          this.addRelationIfValid(relationships, code, cap, 'implements', 'Code folder structure matches capability namespace');
        }
      });
    });

    return relationships;
  }

  private addRelationIfValid(
    relations: AdvancedRelationship[],
    source: CanonicalAsset,
    target: CanonicalAsset,
    type: string,
    provenance: string
  ): void {
    // Check ontology constraints
    const validation = ontologyValidator.validateRelationship(source.type, target.type, type);
    if (!validation.isValid) {
      console.warn(`[CorrelationEngine] Skipping invalid relation: ${source.id} -[${type}]-> ${target.id}. Error: ${validation.error}`);
      return;
    }

    relations.push({
      id: `rel:${source.id}:${target.id}:${type}`,
      sourceId: source.id,
      targetId: target.id,
      type,
      weight: 1.0,
      trustScore: 1.0,
      provenance,
      metadata: {
        sourceType: source.type,
        targetType: target.type,
        timestamp: Date.now()
      }
    });
  }

  private findImportTarget(importPath: string, sourcePath: string, assets: CanonicalAsset[]): CanonicalAsset | null {
    let targetPath = '';

    if (importPath.startsWith('@/')) {
      // Alias path: replace @/ with src/
      targetPath = importPath.replace('@/', 'src/');
    } else if (importPath.startsWith('.')) {
      // Relative path: resolve relative to sourcePath directory
      const absoluteDir = path.dirname(sourcePath);
      targetPath = path.posix.join(absoluteDir, importPath);
    } else {
      return null;
    }

    // Try finding matching code asset by checking prefixes
    // import '.../file' can map to '.../file.ts' or '.../file.tsx' or '.../file/index.ts'
    const cleanPath = targetPath.replace(/\\/g, '/');
    const directMatch = assets.find(a => a.id === `code:${cleanPath}.ts` || a.id === `code:${cleanPath}.tsx`);
    if (directMatch) return directMatch;

    const indexMatch = assets.find(a => a.id === `code:${cleanPath}/index.ts` || a.id === `code:${cleanPath}/index.tsx`);
    if (indexMatch) return indexMatch;

    return null;
  }
}

export const correlationEngine = CorrelationEngine.getInstance();
export default correlationEngine;
