import * as fs from "fs";
import * as path from "path";

export interface PersistedReliabilityState {
  incidents: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    status: "active" | "mitigated" | "resolved";
    severity: "P0" | "P1" | "P2" | "P3";
    detectedAt: string;
    mitigatedAt?: string;
    resolvedAt?: string;
    rca?: string;
    timeline: Array<{ time: string; event: string }>;
  }>;
  chaosRuns: Array<{
    id: string;
    testName: string;
    targetComponent: string;
    status: "running" | "completed" | "failed";
    startedAt: string;
    endedAt?: string;
    impactDescription?: string;
    recoveredSuccessfully?: boolean;
  }>;
  backups: Array<{
    id: string;
    timestamp: string;
    sizeBytes: number;
    status: "healthy" | "unverified" | "failed";
    type: "database" | "knowledge" | "models" | "configs";
    verificationLogs?: string;
  }>;
  capacityHistory: Array<{
    timestamp: string;
    cpuForecastPercent: number;
    gpuForecastPercent: number;
    storageForecastPercent: number;
    costForecastUsd: number;
  }>;
  sloMetrics: {
    availabilitySlo: number; // target e.g. 99.9
    latencySloMs: number; // target e.g. 200
    uptimeMinutes: number;
    downtimeMinutes: number;
    errorCount: number;
    totalRequestsCount: number;
  };
}

const DEFAULT_STATE: PersistedReliabilityState = {
  incidents: [],
  chaosRuns: [],
  backups: [],
  capacityHistory: [],
  sloMetrics: {
    availabilitySlo: 99.9,
    latencySloMs: 200,
    uptimeMinutes: 525600,
    downtimeMinutes: 12,
    errorCount: 3,
    totalRequestsCount: 142050
  }
};

export class ReliabilityStore {
  private static instance: ReliabilityStore | null = null;
  private filePath: string;
  private state: PersistedReliabilityState;

  private constructor() {
    const dbDir = path.resolve(process.cwd(), "databases");
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.filePath = path.join(dbDir, "reliability_store.json");
    this.state = this.loadState();
  }

  public static getInstance(): ReliabilityStore {
    if (!ReliabilityStore.instance) {
      ReliabilityStore.instance = new ReliabilityStore();
    }
    return ReliabilityStore.instance;
  }

  private loadState(): PersistedReliabilityState {
    if (!fs.existsSync(this.filePath)) {
      this.saveState(DEFAULT_STATE);
      return { ...DEFAULT_STATE };
    }
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  private saveState(state: PersistedReliabilityState) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2), "utf-8");
    } catch (e) {
      console.error("[ReliabilityStore] Write failed:", e);
    }
  }

  public getState(): PersistedReliabilityState {
    return this.state;
  }

  public update(updater: (state: PersistedReliabilityState) => void): void {
    updater(this.state);
    this.saveState(this.state);
  }
}

export const reliabilityStore = ReliabilityStore.getInstance();
export default reliabilityStore;
