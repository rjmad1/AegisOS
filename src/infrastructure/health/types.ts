export type HealthStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface HealthCheckResult {
  status: HealthStatus;
  latencyMs: number;
  lastCheckedAt: string;
  version?: string;
  errorMessage?: string;
  details?: Record<string, any>;
}

export interface IHealthCheckable {
  checkHealth(): Promise<HealthCheckResult>;
}
