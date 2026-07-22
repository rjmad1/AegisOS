// src/platform/configuration/ConfigurationLifecycleService.ts
// Configuration Lifecycle Service managing validation, qualification, drift analysis, and self-healing.

import { configurationDigitalTwin } from "./ConfigurationDigitalTwin";
import { logger } from "../../infrastructure/observability/structured-logger";
import { trustAuthorityService } from "../certification/TrustAuthorityService";

export type ConfigurationStatus = "draft" | "validated" | "qualified" | "applied" | "failed";

export interface ConfigurationProfile {
  id: string;
  version: string;
  deploymentProfile: "developer" | "workstation" | "enterprise" | "high-availability";
  status: ConfigurationStatus;
  variables: Record<string, any>;
  signature?: string;
}

export class ConfigurationLifecycleService {
  private static instance: ConfigurationLifecycleService | null = null;
  private currentProfile: ConfigurationProfile | null = null;

  private constructor() {}

  public static getInstance(): ConfigurationLifecycleService {
    if (!ConfigurationLifecycleService.instance) {
      ConfigurationLifecycleService.instance = new ConfigurationLifecycleService();
    }
    return ConfigurationLifecycleService.instance;
  }

  /**
   * Import and progress a configuration profile through the lifecycle.
   */
  public async loadProfile(profile: ConfigurationProfile): Promise<ConfigurationProfile> {
    logger.info(`[ConfigurationLifecycleService] Loading configuration profile: ${profile.id} (v${profile.version})`);

    // 1. Validation & Cryptographic Trust Verification Phase
    trustAuthorityService.verifyArtifactTrust(
      profile.id,
      { version: profile.version, variables: profile.variables },
      profile.signature || ""
    );

    profile.status = "validated";
    logger.info(`[ConfigurationLifecycleService] Profile ${profile.id} validated successfully.`);

    // 2. Qualification Phase
    if (profile.variables["aegis.security.strict"] === true && profile.deploymentProfile === "developer") {
      profile.status = "failed";
      throw new Error("Validation error: strict security cannot be enabled on developer workstation profile.");
    }
    profile.status = "qualified";

    // 3. Applying Phase
    this.currentProfile = profile;
    for (const [k, v] of Object.entries(profile.variables)) {
      configurationDigitalTwin.setIntendedValue(k, v, `profile:${profile.id}`);
    }
    profile.status = "applied";
    logger.info(`[ConfigurationLifecycleService] Configuration profile applied successfully.`);

    return profile;
  }

  /**
   * Run dynamic drift check and execute self-healing configuration convergence.
   */
  public async reconcileAndHeal(): Promise<{ healthy: boolean; repaired: string[] }> {
    logger.info("[ConfigurationLifecycleService] Executing configuration reconciliation loop...");

    // Simulate observing current runtime state
    configurationDigitalTwin.observeValue("aegis.ports.gateway", 18789);
    configurationDigitalTwin.observeValue("aegis.ports.litellm", 4000);
    
    // Simulate port configuration drift (e.g. Ollama ran on wrong port)
    if (this.currentProfile?.variables["aegis.ports.ollama"]) {
      // Simulate drift if not synced yet
      configurationDigitalTwin.observeValue("aegis.ports.ollama", 11435); 
    } else {
      configurationDigitalTwin.observeValue("aegis.ports.ollama", 11434);
    }

    const drifts = configurationDigitalTwin.detectDrifts();
    const repaired: string[] = [];

    if (drifts.length > 0) {
      logger.warn(`[ConfigurationLifecycleService] Configuration drift detected: ${drifts.join("; ")}`);
      
      // Self-heal: Align observed state back to intended config
      for (const drift of drifts) {
        if (drift.includes("aegis.ports.ollama")) {
          const intended = configurationDigitalTwin.getIntendedValue("aegis.ports.ollama")?.value || 11434;
          configurationDigitalTwin.observeValue("aegis.ports.ollama", intended);
          repaired.push("aegis.ports.ollama port reset to intended value");
          logger.info(`[ConfigurationLifecycleService] Self-healed: reset aegis.ports.ollama to ${intended}`);
        }
      }
    } else {
      logger.info("[ConfigurationLifecycleService] Configuration is fully aligned. No drift detected.");
    }

    return {
      healthy: drifts.length === 0 || repaired.length > 0,
      repaired,
    };
  }

  /**
   * Retrieve the active configuration profile.
   */
  public getActiveProfile(): ConfigurationProfile | null {
    return this.currentProfile;
  }
}

export const configurationLifecycleService = ConfigurationLifecycleService.getInstance();
export default configurationLifecycleService;
