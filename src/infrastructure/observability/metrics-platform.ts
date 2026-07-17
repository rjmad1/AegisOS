// src/infrastructure/observability/metrics-platform.ts
// Enterprise Centralised Metrics Platform supporting counter, gauge, and histogram metric types.
// Manages RED, USE, AI Operations, and Business metrics with metadata controls.

export interface MetricMetadata {
  name: string;
  description: string;
  owner: string;
  unit: string;
  threshold?: number;
  alertPolicy?: string;
  retentionMs?: number;
  cardinalityStrategy?: "low" | "medium" | "high";
  defaultConfidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED";
  defaultConfidenceScore?: number;
  defaultProvenance?: string;
}

export interface MetricDataPoint {
  timestamp: number;
  value: number;
  tags: Record<string, string>;
  confidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED";
  confidenceScore?: number;
  provenance?: string;
}

export class MetricsPlatform {
  private static instance: MetricsPlatform | null = null;
  private descriptors: Map<string, MetricMetadata> = new Map();
  private timeSeries: Map<string, MetricDataPoint[]> = new Map();
  private defaultRetentionMs = 3600000 * 24; // Default 24 hours retention for local memory

  private constructor() {
    this.registerSystemMetrics();
  }

  public static getInstance(): MetricsPlatform {
    if (!MetricsPlatform.instance) {
      MetricsPlatform.instance = new MetricsPlatform();
    }
    return MetricsPlatform.instance;
  }

  /**
   * Register a new metric with compliance descriptors.
   */
  public registerMetric(meta: MetricMetadata) {
    this.descriptors.set(meta.name, {
      retentionMs: this.defaultRetentionMs,
      cardinalityStrategy: "low",
      ...meta,
    });
    if (!this.timeSeries.has(meta.name)) {
      this.timeSeries.set(meta.name, []);
    }
  }

  /**
   * Record a counter value (incremental).
   */
  public counter(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    confidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED",
    confidenceScore?: number,
    provenance?: string
  ) {
    const series = this.timeSeries.get(name);
    if (!series) return;

    const lastPoint = series[series.length - 1];
    const baseValue = lastPoint ? lastPoint.value : 0;
    const newValue = baseValue + value;

    this.recordPoint(name, newValue, tags, confidenceClass, confidenceScore, provenance);
  }

  /**
   * Record a gauge value (instantaneous absolute value).
   */
  public gauge(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    confidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED",
    confidenceScore?: number,
    provenance?: string
  ) {
    this.recordPoint(name, value, tags, confidenceClass, confidenceScore, provenance);
  }

  /**
   * Record a histogram/duration value.
   */
  public histogram(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    confidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED",
    confidenceScore?: number,
    provenance?: string
  ) {
    // For local memory, we store the raw durations and compute averages/percentiles dynamically.
    this.recordPoint(name, value, tags, confidenceClass, confidenceScore, provenance);
  }

  private recordPoint(
    name: string,
    value: number,
    tags: Record<string, string>,
    confidenceClass?: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED",
    confidenceScore?: number,
    provenance?: string
  ) {
    const series = this.timeSeries.get(name);
    if (!series) return;

    const now = Date.now();
    const meta = this.descriptors.get(name);

    series.push({
      timestamp: now,
      value,
      tags,
      confidenceClass: confidenceClass || meta?.defaultConfidenceClass || "MEASURED",
      confidenceScore: confidenceScore !== undefined ? confidenceScore : (meta?.defaultConfidenceScore || 100),
      provenance: provenance || meta?.defaultProvenance || "Execution Runtime Boundary"
    });

    // Clean up expired metrics based on retention policy
    const retention = meta?.retentionMs || this.defaultRetentionMs;
    const cutoff = now - retention;

    // Filter points
    this.timeSeries.set(
      name,
      series.filter((p) => p.timestamp >= cutoff)
    );
  }

  /**
   * Get latest confidence metrics for a metric.
   */
  public getMetricConfidence(name: string): { level: "MEASURED" | "OBSERVED" | "ESTIMATED" | "PREDICTED"; score: number; provenance: string } {
    const points = this.timeSeries.get(name) || [];
    const meta = this.descriptors.get(name);

    if (points.length > 0) {
      const lastPoint = points[points.length - 1];
      return {
        level: lastPoint.confidenceClass || meta?.defaultConfidenceClass || "MEASURED",
        score: lastPoint.confidenceScore !== undefined ? lastPoint.confidenceScore : (meta?.defaultConfidenceScore || 100),
        provenance: lastPoint.provenance || meta?.defaultProvenance || "Execution Runtime Boundary"
      };
    }

    return {
      level: meta?.defaultConfidenceClass || "MEASURED",
      score: meta?.defaultConfidenceScore || 100,
      provenance: meta?.defaultProvenance || "Default Configuration Baseline"
    };
  }

  /**
   * Retrieve metric descriptors.
   */
  public getDescriptors(): MetricMetadata[] {
    return Array.from(this.descriptors.values());
  }

  /**
   * Retrieve time series points for a given metric.
   */
  public getPoints(name: string): MetricDataPoint[] {
    return this.timeSeries.get(name) || [];
  }

  /**
   * Retrieve the latest value for a gauge/counter.
   */
  public getLatestValue(name: string, tags?: Record<string, string>): number {
    const points = this.timeSeries.get(name) || [];
    if (points.length === 0) return 0;

    if (tags) {
      const filtered = points.filter((p) =>
        Object.entries(tags).every(([k, v]) => p.tags[k] === v)
      );
      return filtered.length > 0 ? filtered[filtered.length - 1].value : 0;
    }

    return points[points.length - 1].value;
  }

  /**
   * Get average value of a metric.
   */
  public getAverageValue(name: string): number {
    const points = this.timeSeries.get(name) || [];
    if (points.length === 0) return 0;
    const sum = points.reduce((acc, p) => acc + p.value, 0);
    return sum / points.length;
  }

  /**
   * Format all recorded metrics into Prometheus-compatible text format.
   */
  public toPrometheusFormat(): string {
    let out = "";
    for (const [name, meta] of this.descriptors.entries()) {
      out += `# HELP ${name} ${meta.description}\n`;
      out += `# TYPE ${name} ${meta.unit === "counter" ? "counter" : "gauge"}\n`;

      const points = this.timeSeries.get(name) || [];
      // To prevent massive cardinality inflation in prometheus text, we only export the latest values grouped by tags
      const grouped = new Map<string, { value: number; tags: Record<string, string> }>();

      for (const p of points) {
        const tagKey = Object.entries(p.tags)
          .sort(([k1], [k2]) => k1.localeCompare(k2))
          .map(([k, v]) => `${k}="${v}"`)
          .join(",");
        grouped.set(tagKey, { value: p.value, tags: p.tags });
      }

      if (grouped.size === 0) {
        // Fallback default value if no points recorded yet
        out += `${name} 0\n\n`;
      } else {
        for (const [tagStr, data] of grouped.entries()) {
          const formattedTags = tagStr ? `{${tagStr}}` : "";
          out += `${name}${formattedTags} ${data.value}\n`;
        }
        out += "\n";
      }
    }
    return out;
  }

  private registerSystemMetrics() {
    // -------------------------------------------------------------
    // RED Metrics (Rate, Errors, Duration)
    // -------------------------------------------------------------
    this.registerMetric({
      name: "api_requests_total",
      description: "RED Signal: Cumulative count of processed HTTP API requests",
      owner: "Platform Engineering",
      unit: "counter",
      cardinalityStrategy: "medium",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Next.js routing proxy interceptor",
    });
    this.registerMetric({
      name: "api_errors_total",
      description: "RED Signal: Cumulative count of failed HTTP API requests",
      owner: "Platform Engineering",
      unit: "counter",
      cardinalityStrategy: "medium",
      threshold: 5,
      alertPolicy: "Severity-1 Critical API Failure",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Next.js routing proxy interceptor",
    });
    this.registerMetric({
      name: "api_latency_ms",
      description: "RED Signal: Latency histogram for HTTP endpoints in milliseconds",
      owner: "Platform Engineering",
      unit: "gauge",
      threshold: 800,
      alertPolicy: "Latency-SLO-Violation",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Next.js routing proxy interceptor",
    });

    // -------------------------------------------------------------
    // USE Metrics (Utilization, Saturation, Errors)
    // -------------------------------------------------------------
    this.registerMetric({
      name: "system_cpu_usage_ratio",
      description: "USE Signal: Host CPU usage percentage ratio",
      owner: "Platform Engineering",
      unit: "gauge",
      threshold: 0.90,
      alertPolicy: "Host-CPU-Saturation",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Node.js os.cpus() system query",
    });
    this.registerMetric({
      name: "system_memory_usage_ratio",
      description: "USE Signal: Host RAM usage percentage ratio",
      owner: "Platform Engineering",
      unit: "gauge",
      threshold: 0.85,
      alertPolicy: "Host-RAM-Saturation",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Node.js os.totalmem() / os.freemem()",
    });
    this.registerMetric({
      name: "system_gpu_vram_ratio",
      description: "USE Signal: Host GPU memory VRAM utilization ratio",
      owner: "AI Infrastructure",
      unit: "gauge",
      threshold: 0.92,
      alertPolicy: "GPU-VRAM-Exhaustion",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 98,
      defaultProvenance: "nvidia-smi utility query",
    });
    this.registerMetric({
      name: "system_gpu_temp_celsius",
      description: "USE Signal: Physical GPU Core temperature in Celsius",
      owner: "AI Infrastructure",
      unit: "gauge",
      threshold: 82,
      alertPolicy: "GPU-Thermal-Throttling",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 98,
      defaultProvenance: "nvidia-smi utility query",
    });
    this.registerMetric({
      name: "system_disk_free_bytes",
      description: "USE Signal: Host storage free disk space in bytes",
      owner: "Platform Engineering",
      unit: "gauge",
      threshold: 5000000000, // 5GB free threshold
      alertPolicy: "Disk-Space-Depletion",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Node.js fs.statfsSync()",
    });

    // -------------------------------------------------------------
    // AI Operations Telemetry Metrics
    // -------------------------------------------------------------
    this.registerMetric({
      name: "ai_prompt_tokens_total",
      description: "AI Ops: Total tokens sent inside LLM prompt requests",
      owner: "AI Operations Architect",
      unit: "counter",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AIRuntimeKernel token logs",
    });
    this.registerMetric({
      name: "ai_completion_tokens_total",
      description: "AI Ops: Total tokens generated inside LLM responses",
      owner: "AI Operations Architect",
      unit: "counter",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AIRuntimeKernel token logs",
    });
    this.registerMetric({
      name: "ai_inference_ttft_ms",
      description: "AI Ops: Time To First Token latency in milliseconds",
      owner: "AI Operations Architect",
      unit: "gauge",
      threshold: 500,
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AIRuntimeKernel performance timer",
    });
    this.registerMetric({
      name: "ai_inference_tps",
      description: "AI Ops: LLM generation rate in Tokens Per Second",
      owner: "AI Operations Architect",
      unit: "gauge",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AIRuntimeKernel output calculator",
    });
    this.registerMetric({
      name: "ai_inference_errors_total",
      description: "AI Ops: Cumulative count of inference invocation failures",
      owner: "AI Operations Architect",
      unit: "counter",
      threshold: 3,
      alertPolicy: "Inference-Failure-Cascade",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "Model Router dynamic failover tracker",
    });
    this.registerMetric({
      name: "ai_cost_usd_accumulated",
      description: "AI Ops: Financial budget spend in USD based on token counts",
      owner: "AI Operations Architect",
      unit: "counter",
      threshold: 50.0, // Alert if exceeds $50 budget
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AIRuntimeKernel budget gate ledger",
    });
    this.registerMetric({
      name: "ai_grounding_score_ratio",
      description: "AI Ops: Evaluation of grounded answers mapped to Knowledge retrieval context",
      owner: "AI Operations Architect",
      unit: "gauge",
      defaultConfidenceClass: "OBSERVED",
      defaultConfidenceScore: 95,
      defaultProvenance: "EvaluationPlatform cosine similarity",
    });
    this.registerMetric({
      name: "ai_hallucination_detected_total",
      description: "AI Ops: Cumulative count of detected hallucination content structures",
      owner: "AI Operations Architect",
      unit: "counter",
      defaultConfidenceClass: "OBSERVED",
      defaultConfidenceScore: 92,
      defaultProvenance: "EvaluationPlatform regex validation",
    });
    this.registerMetric({
      name: "ai_safety_violations_total",
      description: "AI Ops: Cumulative block count of response moderation violations",
      owner: "AI Operations Architect",
      unit: "counter",
      threshold: 2,
      defaultConfidenceClass: "OBSERVED",
      defaultConfidenceScore: 98,
      defaultProvenance: "ExecutiveControlPlane moderation gate",
    });
    this.registerMetric({
      name: "ai_jailbreak_attempts_total",
      description: "AI Ops: Cumulative count of prompt injections blocked by firewall",
      owner: "AI Operations Architect",
      unit: "counter",
      threshold: 1,
      alertPolicy: "Security-Prompt-Firewall-Active",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "policyEnforcer regex matching scanner",
    });
    this.registerMetric({
      name: "ai_pii_redactions_total",
      description: "AI Ops: Cumulative count of redacted PII fields from prompts",
      owner: "AI Operations Architect",
      unit: "counter",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "policyEnforcer regex scrubbing",
    });
    this.registerMetric({
      name: "ai_tool_failures_total",
      description: "AI Ops: Cumulative count of agent executor tool execution failures",
      owner: "AI Operations Architect",
      unit: "counter",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "AgentRuntime executor exceptions",
    });

    // -------------------------------------------------------------
    // Business & Workflow Metrics
    // -------------------------------------------------------------
    this.registerMetric({
      name: "workflow_runs_total",
      description: "Business: Cumulative count of started workflows",
      owner: "Platform Engineering",
      unit: "counter",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "workflowService execution event emitter",
    });
    this.registerMetric({
      name: "workflow_failures_total",
      description: "Business: Cumulative count of failed workflows",
      owner: "Platform Engineering",
      unit: "counter",
      threshold: 1,
      alertPolicy: "Saga-Workflow-Failed-Alert",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "workflowService exception listener",
    });
    this.registerMetric({
      name: "queue_job_backlog_count",
      description: "USE Signal: Resilient Job Queue active backlog items",
      owner: "Platform Engineering",
      unit: "gauge",
      threshold: 15,
      alertPolicy: "Queue-Saturation-Warning",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "jobQueue internal counter",
    });
    this.registerMetric({
      name: "security_lockout_active_total",
      description: "Security: Count of active lockouts of brute-forcing IPs",
      owner: "Zero Trust Lead",
      unit: "gauge",
      defaultConfidenceClass: "MEASURED",
      defaultConfidenceScore: 100,
      defaultProvenance: "BruteForceDefender blacklist memory registers",
    });
  }
}

export const metricsPlatform = MetricsPlatform.getInstance();
export default metricsPlatform;
