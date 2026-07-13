// src/infrastructure/observability/alerting-platform.ts
// Enterprise Central Alerting Platform with Thresholds, Suppression, Deduplication, and Escalation.

import { metricsPlatform } from "./metrics-platform";
import { EventBus } from "../../platform/event-bus/EventBus";

export interface AlertInstance {
  id: string;
  name: string;
  metricName: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  value: number;
  threshold?: number;
  timestamp: string;
  suppressed: boolean;
  status: "firing" | "resolved";
}

export class AlertingPlatform {
  private static instance: AlertingPlatform | null = null;
  private activeAlerts: Map<string, AlertInstance> = new Map();
  private historicalAlerts: AlertInstance[] = [];
  private alertInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAlertEvaluator();
  }

  public static getInstance(): AlertingPlatform {
    if (!AlertingPlatform.instance) {
      AlertingPlatform.instance = new AlertingPlatform();
    }
    return AlertingPlatform.instance;
  }

  public getActiveAlerts(): AlertInstance[] {
    return Array.from(this.activeAlerts.values());
  }

  public getAlertHistory(): AlertInstance[] {
    return this.historicalAlerts;
  }

  /**
   * Periodically evaluate rules against Metrics Platform values.
   */
  public evaluateRules() {
    const descriptors = metricsPlatform.getDescriptors();
    const now = new Date().toISOString();

    for (const desc of descriptors) {
      if (desc.threshold === undefined) continue;

      const latestVal = metricsPlatform.getLatestValue(desc.name);

      // Check if threshold violated
      // For system_disk_free_bytes, threshold is lower-bound (less than 5GB is bad)
      const isViolated =
        desc.name === "system_disk_free_bytes"
          ? latestVal > 0 && latestVal < desc.threshold
          : latestVal > desc.threshold;

      const alertKey = `${desc.name}_violation`;

      if (isViolated) {
        // Trigger alert if not already firing
        if (!this.activeAlerts.has(alertKey)) {
          const severity =
            desc.name.includes("critical") || desc.name.includes("jailbreak") || desc.name.includes("safety")
              ? ("critical" as const)
              : ("error" as const);

          // Anomaly/Suppression check
          // Suppress alerts if maintenance mode is on
          const isSuppressed = process.env.MAINTENANCE_MODE === "true";

          const alert: AlertInstance = {
            id: `alt-${Math.random().toString(36).substring(2, 8)}`,
            name: desc.alertPolicy || `${desc.name} Threshold Exceeded`,
            metricName: desc.name,
            severity,
            message: `Metric "${desc.name}" value ${latestVal} violated threshold of ${desc.threshold}. Owner: ${desc.owner}`,
            value: latestVal,
            threshold: desc.threshold,
            timestamp: now,
            suppressed: isSuppressed,
            status: "firing",
          };

          this.activeAlerts.set(alertKey, alert);
          this.historicalAlerts.push(alert);

          // Deduplicated event dispatching
          if (!isSuppressed) {
            EventBus.publish("notification:created", {
              id: alert.id,
              type: "alert",
              title: `[ALERT] ${alert.name}: ${alert.message}`,
            });
            console.warn(`[AlertingEngine] Alert FIRING: ${alert.name} (${alert.message})`);
          }
        }
      } else {
        // Resolve if it was firing
        const activeAlert = this.activeAlerts.get(alertKey);
        if (activeAlert) {
          activeAlert.status = "resolved";
          this.activeAlerts.delete(alertKey);
          
          const resolvedAlert: AlertInstance = {
            ...activeAlert,
            status: "resolved",
            timestamp: now,
          };
          this.historicalAlerts.push(resolvedAlert);

          console.log(`[AlertingEngine] Alert RESOLVED: ${activeAlert.name}`);
        }
      }
    }

    // Dynamic Anomaly Detection Rule (deviation check)
    this.evaluateAnomalyDetections(now);
  }

  private evaluateAnomalyDetections(now: string) {
    // Dynamic rule for API latency deviation (mean + 3*stdDev)
    const points = metricsPlatform.getPoints("api_latency_ms");
    if (points.length > 10) {
      const values = points.map((p) => p.value);
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const latestVal = values[values.length - 1];
      const limit = mean + 3 * stdDev;

      if (latestVal > limit && latestVal > 200) { // minimum threshold to prevent noise
        const alertKey = "api_latency_anomaly";
        if (!this.activeAlerts.has(alertKey)) {
          const alert: AlertInstance = {
            id: `alt-${Math.random().toString(36).substring(2, 8)}`,
            name: "API Latency Anomaly Detected",
            metricName: "api_latency_ms",
            severity: "warning",
            message: `API Latency spike detected. Value ${latestVal.toFixed(1)}ms exceeded dynamic anomaly boundary of ${limit.toFixed(1)}ms (mean: ${mean.toFixed(1)}ms, stdDev: ${stdDev.toFixed(1)}ms).`,
            value: latestVal,
            threshold: limit,
            timestamp: now,
            suppressed: false,
            status: "firing",
          };
          this.activeAlerts.set(alertKey, alert);
          this.historicalAlerts.push(alert);
          EventBus.publish("notification:created", {
            id: alert.id,
            type: "alert",
            title: `[ALERT] ${alert.name}: ${alert.message}`,
          });
        }
      }
    }
  }

  private startAlertEvaluator() {
    if (this.alertInterval) return;
    this.alertInterval = setInterval(() => {
      try {
        this.evaluateRules();
      } catch (err: any) {
        console.error("[AlertingPlatform] Evaluation error:", err.message);
      }
    }, 5000); // Check rules every 5 seconds
  }

  public shutdown() {
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
  }
}

export const alertingPlatform = AlertingPlatform.getInstance();
export default alertingPlatform;
