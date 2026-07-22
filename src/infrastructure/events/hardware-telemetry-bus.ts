import { hardenedEventBus, HardenedEvent } from "./event-bus";
import * as crypto from "crypto";

export interface HardwareTelemetryPayload {
  gpuId: string;
  vramFreeBytes: number;
  vramTotalBytes: number;
  vramUsedBytes: number;
  gpuUtilizationPct: number;
  temperatureCelsius?: number;
  cudaVersion?: string;
  timestampMs: number;
}

export class HardwareTelemetryBus {
  private static instance: HardwareTelemetryBus | null = null;

  private constructor() {}

  public static getInstance(): HardwareTelemetryBus {
    if (!HardwareTelemetryBus.instance) {
      HardwareTelemetryBus.instance = new HardwareTelemetryBus();
    }
    return HardwareTelemetryBus.instance;
  }

  /**
   * Publishes a raw GPU/Hardware telemetry sample onto the hardened event bus.
   */
  public emitTelemetry(payload: HardwareTelemetryPayload): void {
    const event: HardenedEvent = {
      id: `hw-telemetry-${crypto.randomUUID()}`,
      name: "HardwareTelemetryReport",
      timestamp: new Date().toISOString(),
      source: "Layer0:HardwareTelemetryBus",
      version: "v1",
      priority: "medium",
      securityClassification: "internal",
      retentionPolicy: "temp",
      correlationId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      payload
    };

    try {
      hardenedEventBus.publish(event);
    } catch (e) {
      console.warn("[HardwareTelemetryBus] Failed to publish telemetry event:", e);
    }
  }

  /**
   * Subscribe to live hardware telemetry events and return an unsubscribe handle function.
   */
  public subscribe(handler: (payload: HardwareTelemetryPayload) => void): () => void {
    const subId = hardenedEventBus.subscribe("HardwareTelemetryReport", (event: HardenedEvent) => {
      if (event && event.payload) {
        handler(event.payload as HardwareTelemetryPayload);
      }
    });

    return () => {
      hardenedEventBus.unsubscribe(subId);
    };
  }
}

export const hardwareTelemetryBus = HardwareTelemetryBus.getInstance();
