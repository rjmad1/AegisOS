export type CertificationStatus = 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
export type CertificationScore = number; // 0-100

export interface CertificationEvidence {
  logs?: string[];
  metrics?: Record<string, number>;
  traces?: string[];
  screenshots?: string[];
  artifacts?: string[];
  reportPath?: string;
  costEstimate?: number;
  resourceProfile?: {
    peakMemoryMB: number;
    peakCpuPercent: number;
    gpuMemoryMB?: number;
  };
}

export interface HistoricalContext {
  previousScore?: CertificationScore;
  previousStatus?: CertificationStatus;
  latencyTrend?: 'IMPROVED' | 'REGRESSED' | 'STABLE';
  memoryTrend?: 'IMPROVED' | 'REGRESSED' | 'STABLE';
  tokenCostTrend?: 'IMPROVED' | 'REGRESSED' | 'STABLE';
}

export interface CertificationResult {
  status: CertificationStatus;
  score: CertificationScore;
  timestamp: string;
  durationMs: number;
  message?: string;
  evidence?: CertificationEvidence;
  historical?: HistoricalContext;
}

export interface CertificationNode {
  id: string;
  name: string;
  description: string;
  type: 'PLATFORM' | 'DOMAIN' | 'SUITE' | 'WORKLOAD' | 'CAPABILITY';
  weight: number; // 0.0 to 1.0
  children?: CertificationNode[];
  result?: CertificationResult;
}

export interface PlatformHealthIndex {
  architecture: number;
  performance: number;
  reliability: number;
  security: number;
  maintainability: number;
  observability: number;
  governance: number;
  certification: number;
  overall: number; // Aggregated score
}

export interface ReleaseManifest {
  version: string;
  gitSha: string;
  timestamp: string;
  componentVersions: Record<string, string>;
  models: string[];
  capabilities: string[];
  mcpServers: string[];
  sbomPath: string;
  platformHealth: PlatformHealthIndex;
  certificationTree: CertificationNode;
  signedHash?: string;
}
