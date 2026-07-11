import { centralConfig } from "../configuration/central-config";

export class FeatureFlags {
  private static instance: FeatureFlags | null = null;
  private defaultFlags: Record<string, boolean> = {
    contextCompression: false,   // Ponytail & Headroom context optimization (Phase 2)
    astIndexing: false,          // CodeGraph AST indexing (Phase 3)
    asynchronousReview: true,    // LLM Council reviews run async (Phase 5)
    offlineOptimizations: false, // SkillOpt offline refinements (Phase 7)
    eventDrivenIngestion: true,  // Event-driven file indexing
  };

  private constructor() {}

  public static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }

  public isEnabled(flagName: string): boolean {
    const configuredFlags = centralConfig.get<Record<string, boolean>>("featureFlags", {});
    if (flagName in configuredFlags) {
      return configuredFlags[flagName];
    }
    return this.defaultFlags[flagName] || false;
  }

  public setFlag(flagName: string, value: boolean): void {
    const configuredFlags = centralConfig.get<Record<string, boolean>>("featureFlags", {});
    configuredFlags[flagName] = value;
    centralConfig.set("featureFlags", configuredFlags);
    centralConfig.save();
    console.log(`[FeatureFlags] Set flag "${flagName}" to ${value}`);
  }

  public getAllFlags(): Record<string, boolean> {
    const configuredFlags = centralConfig.get<Record<string, boolean>>("featureFlags", {});
    return {
      ...this.defaultFlags,
      ...configuredFlags,
    };
  }
}

export const featureFlags = FeatureFlags.getInstance();
export default featureFlags;
