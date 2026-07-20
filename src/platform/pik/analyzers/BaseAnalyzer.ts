import { OptimizationRecommendation } from '../types';
import { platformTwin } from '../twin/PlatformDigitalTwin';

export abstract class BaseAnalyzer {
  protected twin = platformTwin;

  /**
   * The unique name of this analyzer (e.g. ArchitectureIntelligence)
   */
  public abstract get name(): string;

  /**
   * Evaluates the Digital Twin and returns a list of optimization recommendations.
   */
  public abstract analyze(): Promise<OptimizationRecommendation[]>;
}
