import { EventEmitter } from 'events';

export type AdoptionAssetType = 
  | 'ReferenceArchitecture' 
  | 'LandingZone' 
  | 'DeploymentPlaybook' 
  | 'MigrationGuide' 
  | 'AdoptionMaturityModel' 
  | 'ReadinessAssessment' 
  | 'OperationalChecklist' 
  | 'BestPractices';

export interface EnterpriseAdoptionAsset {
  id: string;
  type: AdoptionAssetType;
  title: string;
  description: string;
  contentRef: string; // reference to actual content or Knowledge Pack
  targetAudience: string[];
}

export interface ReadinessAssessmentResult {
  tenantId: string;
  assessmentId: string;
  score: number;
  maturityLevel: 'AdHoc' | 'Repeatable' | 'Defined' | 'Managed' | 'Optimizing';
  gaps: string[];
  recommendedAssets: string[]; // Asset IDs
}

export class EnterpriseAdoptionFramework extends EventEmitter {
  private assets: Map<string, EnterpriseAdoptionAsset> = new Map();
  private assessments: Map<string, ReadinessAssessmentResult> = new Map();

  constructor() {
    super();
  }

  public registerAdoptionAsset(asset: EnterpriseAdoptionAsset): void {
    this.assets.set(asset.id, asset);
    this.emit('adoption_asset_registered', asset);
  }

  public getAssetsByType(type: AdoptionAssetType): EnterpriseAdoptionAsset[] {
    return Array.from(this.assets.values()).filter(a => a.type === type);
  }

  public evaluateReadiness(tenantId: string, assessmentId: string, data: any): ReadinessAssessmentResult {
    // Abstract logic to evaluate readiness
    const result: ReadinessAssessmentResult = {
      tenantId,
      assessmentId,
      score: 75,
      maturityLevel: 'Defined',
      gaps: ['Lack of automated runbooks', 'Incomplete lifecycle governance'],
      recommendedAssets: [] // Would map to actual asset IDs based on gaps
    };

    this.assessments.set(`${tenantId}-${assessmentId}`, result);
    this.emit('readiness_evaluated', result);
    
    return result;
  }
}
