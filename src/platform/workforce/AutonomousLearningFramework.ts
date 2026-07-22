export interface LearningRecommendation {
  id: string;
  sourceContext: string;
  type: 'WorkflowRefinement' | 'PolicyRefinement' | 'KnowledgeGap' | 'SkillEvolution';
  description: string;
  approved: boolean;
}

export class AutonomousLearningFramework {
  private static instance: AutonomousLearningFramework | null = null;
  private recommendations: Map<string, LearningRecommendation> = new Map();

  private constructor() {}

  public static getInstance(): AutonomousLearningFramework {
    if (!AutonomousLearningFramework.instance) {
      AutonomousLearningFramework.instance = new AutonomousLearningFramework();
    }
    return AutonomousLearningFramework.instance;
  }

  public generateRecommendation(recommendation: Omit<LearningRecommendation, 'approved'>): LearningRecommendation {
    const fullRec: LearningRecommendation = {
      ...recommendation,
      approved: false
    };
    this.recommendations.set(fullRec.id, fullRec);
    return fullRec;
  }

  public approveRecommendation(id: string): boolean {
    const rec = this.recommendations.get(id);
    if (rec) {
      rec.approved = true;
      this.recommendations.set(id, rec);
      return true;
    }
    return false;
  }

  public getRecommendations(): LearningRecommendation[] {
    return Array.from(this.recommendations.values());
  }
}

export const autonomousLearningFramework = AutonomousLearningFramework.getInstance();
