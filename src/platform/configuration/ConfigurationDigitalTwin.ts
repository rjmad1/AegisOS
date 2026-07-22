// src/platform/configuration/ConfigurationDigitalTwin.ts
// Configuration Digital Twin modeling configuration intent vs operational runtime.

import { logger } from "../../infrastructure/observability/structured-logger";

export interface ConfigurationItem {
  key: string;
  value: any;
  lastUpdated: string;
  source: string;
}

export class ConfigurationDigitalTwin {
  private static instance: ConfigurationDigitalTwin | null = null;
  private intendedState: Map<string, ConfigurationItem> = new Map();
  private observedState: Map<string, ConfigurationItem> = new Map();

  private constructor() {
    // Populate default intended state
    this.setIntendedValue("aegis.ports.gateway", 18789, "system-default");
    this.setIntendedValue("aegis.ports.litellm", 4000, "system-default");
    this.setIntendedValue("aegis.ports.ollama", 11434, "system-default");
  }

  public static getInstance(): ConfigurationDigitalTwin {
    if (!ConfigurationDigitalTwin.instance) {
      ConfigurationDigitalTwin.instance = new ConfigurationDigitalTwin();
    }
    return ConfigurationDigitalTwin.instance;
  }

  /**
   * Record the intended value for a configuration key.
   */
  public setIntendedValue(key: string, value: any, source: string): void {
    this.intendedState.set(key, {
      key,
      value,
      lastUpdated: new Date().toISOString(),
      source,
    });
    logger.info(`[ConfigurationTwin] Set intended state: ${key} = ${value} (Source: ${source})`);
  }

  /**
   * Retrieve the intended state item.
   */
  public getIntendedValue(key: string): ConfigurationItem | null {
    return this.intendedState.get(key) || null;
  }

  /**
   * Record the currently observed operational runtime value for a key.
   */
  public observeValue(key: string, value: any): void {
    this.observedState.set(key, {
      key,
      value,
      lastUpdated: new Date().toISOString(),
      source: "runtime-observation",
    });
  }

  /**
   * Identify any configuration drifts between intended and observed state.
   */
  public detectDrifts(): string[] {
    const drifts: string[] = [];

    for (const [key, intended] of this.intendedState.entries()) {
      const observed = this.observedState.get(key);
      if (!observed) {
        drifts.push(`Drift detected: ${key} is missing in observed runtime state.`);
      } else if (JSON.stringify(intended.value) !== JSON.stringify(observed.value)) {
        drifts.push(
          `Drift detected: ${key} mismatch. Intended: ${JSON.stringify(intended.value)}, Observed: ${JSON.stringify(
            observed.value
          )}`
        );
      }
    }

    return drifts;
  }

  /**
   * Synchronize the observed state (for development/bootstrap).
   */
  public syncObserved(observedMap: Record<string, any>): void {
    for (const [k, v] of Object.entries(observedMap)) {
      this.observeValue(k, v);
    }
  }
}

export const configurationDigitalTwin = ConfigurationDigitalTwin.getInstance();
export default configurationDigitalTwin;
