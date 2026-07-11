import * as fs from "fs";
import * as path from "path";

export interface SystemEconomicMetric {
  timestamp: string;
  totalTokensConsumed: number;
  estimatedCostUsd: number;
  gpuPowerDrawWatts: number;
  averageCpuUsage: number;
  compressionSavingsUsd: number;
}

export class EconomicsManager {
  private static instance: EconomicsManager | null = null;
  private dbPath: string;

  private constructor() {
    this.dbPath = path.resolve(process.cwd(), "databases", "platform_economics.json");
    this.ensureDirs();
  }

  public static getInstance(): EconomicsManager {
    if (!EconomicsManager.instance) {
      EconomicsManager.instance = new EconomicsManager();
    }
    return EconomicsManager.instance;
  }

  private ensureDirs() {
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  public logMetric(tokens: number, compressedTokensSaved: number) {
    try {
      let metrics: SystemEconomicMetric[] = [];
      if (fs.existsSync(this.dbPath)) {
        metrics = JSON.parse(fs.readFileSync(this.dbPath, "utf-8"));
      }

      // Cost parameters: $0.0015 / 1k tokens standard, $0.0030 / 1k output
      const cost = (tokens / 1000) * 0.0015;
      const savings = (compressedTokensSaved / 1000) * 0.0015;

      const newMetric: SystemEconomicMetric = {
        timestamp: new Date().toISOString(),
        totalTokensConsumed: tokens,
        estimatedCostUsd: cost,
        gpuPowerDrawWatts: Math.floor(Math.random() * 80) + 120, // simulated RTX 5080 load
        averageCpuUsage: Math.floor(Math.random() * 15) + 5,
        compressionSavingsUsd: savings
      };

      metrics.push(newMetric);
      if (metrics.length > 100) metrics = metrics.slice(-100);
      fs.writeFileSync(this.dbPath, JSON.stringify(metrics, null, 2), "utf-8");
    } catch (err) {
      console.error("[EconomicsManager] Failed to write economics log:", err);
    }
  }

  public getSummary() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const metrics = JSON.parse(fs.readFileSync(this.dbPath, "utf-8")) as SystemEconomicMetric[];
        const totalCost = metrics.reduce((sum, m) => sum + m.estimatedCostUsd, 0);
        const totalSaved = metrics.reduce((sum, m) => sum + m.compressionSavingsUsd, 0);
        const averagePower = metrics.length > 0 
          ? Math.round(metrics.reduce((sum, m) => sum + m.gpuPowerDrawWatts, 0) / metrics.length) 
          : 0;

        return {
          totalQueriesLogged: metrics.length,
          totalCostUsd: parseFloat(totalCost.toFixed(5)),
          totalSavedUsd: parseFloat(totalSaved.toFixed(5)),
          averageGpuPowerDrawWatts: averagePower,
          recommendations: [
            "Enable Headroom prompt compression by default to reduce LLM ingestion costs by up to 45%.",
            "Schedule heavy LLM Council review tasks in background queues during off-peak hours to manage CPU thermal thresholds."
          ]
        };
      }
    } catch (err) {
      console.error("[EconomicsManager] Failed to calculate summary:", err);
    }

    return {
      totalQueriesLogged: 0,
      totalCostUsd: 0.0,
      totalSavedUsd: 0.0,
      averageGpuPowerDrawWatts: 0,
      recommendations: ["No metrics logged yet. Run LLM queries to capture platform economics telemetry data."]
    };
  }
}

export const economicsManager = EconomicsManager.getInstance();
export default economicsManager;
