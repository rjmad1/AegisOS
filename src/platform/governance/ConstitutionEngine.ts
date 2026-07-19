import * as fs from 'fs';
import * as path from 'path';
import { OptimizationRecommendation, RiskLevels } from '../pial/types';

export interface ConstitutionalPrinciple {
  id: string;
  severity: 'warning' | 'critical';
  description: string;
}

export interface PlatformConstitution {
  principles: ConstitutionalPrinciple[];
}

export class ConstitutionEngine {
  private static instance: ConstitutionEngine | null = null;
  private constitution: PlatformConstitution | null = null;

  private constructor() {}

  public static getInstance(): ConstitutionEngine {
    if (!ConstitutionEngine.instance) {
      ConstitutionEngine.instance = new ConstitutionEngine();
    }
    return ConstitutionEngine.instance;
  }

  /**
   * Loads and parses the constitution.yaml file.
   * Note: In a production environment, this would use a robust YAML parser (like js-yaml) 
   * and validate the schema. For MVP, we provide a basic mock parsing mechanism.
   */
  public async loadConstitution(filePath?: string): Promise<void> {
    const defaultPath = path.join(__dirname, 'policies', 'constitution.yaml');
    const targetPath = filePath || defaultPath;
    
    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      this.constitution = this.parseSimpleYaml(content);
    } catch (err) {
      console.warn(`[ConstitutionEngine] Failed to load constitution from ${targetPath}:`, err);
      // Fallback empty constitution if file is missing
      this.constitution = { principles: [] };
    }
  }

  public getConstitution(): PlatformConstitution | null {
    return this.constitution;
  }

  /**
   * Determines if a recommendation is authorized to execute autonomously
   * based on the GPF risk level classifications and constitutional policies.
   */
  public isAuthorized(recommendation: OptimizationRecommendation): boolean {
    if (!this.constitution) {
      return false; // Fail safe
    }

    // GPF Risk Level Rules
    if (recommendation.riskLevel === RiskLevels.LEVEL_0_OBSERVATION) {
      return true; // Always autonomous
    }

    if (recommendation.riskLevel === RiskLevels.LEVEL_1_MAINTENANCE) {
      // Allowed if policy permits. For now, checking if it's explicitly marked as eligible.
      return recommendation.autonomousEligibility;
    }

    // Levels 2, 3, 4 require human or organizational approval (Advisory mode)
    return false;
  }

  /**
   * Basic MVP YAML parser tailored to the constitution schema.
   */
  private parseSimpleYaml(content: string): PlatformConstitution {
    const principles: ConstitutionalPrinciple[] = [];
    const blocks = content.split('- id:').slice(1); // skip the preamble

    for (const block of blocks) {
      const idMatch = block.match(/([a-zA-Z0-9_-]+)/);
      const sevMatch = block.match(/severity:\s*(warning|critical)/);
      const descMatch = block.match(/description:\s*(.+)/);

      if (idMatch && sevMatch) {
        principles.push({
          id: idMatch[1].trim(),
          severity: sevMatch[1] as 'warning' | 'critical',
          description: descMatch ? descMatch[1].trim() : ''
        });
      }
    }

    return { principles };
  }
}

export const constitutionEngine = ConstitutionEngine.getInstance();
export default constitutionEngine;
