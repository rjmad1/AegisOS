import * as crypto from "crypto";
import { otelPlatform } from "./telemetry-platform";

export interface Span {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
  links?: Array<{ traceId: string; spanId: string; attributes?: Record<string, any> }>;
}

export interface TraceContext {
  traceId: string;
  activeSpanId: string;
  baggage: Record<string, string>;
}

export class TelemetryTracker {
  private static instance: TelemetryTracker | null = null;
  private activeTraces: Map<string, Span[]> = new Map();
  private baggageStores: Map<string, Record<string, string>> = new Map();

  private constructor() {}

  public static getInstance(): TelemetryTracker {
    if (!TelemetryTracker.instance) {
      TelemetryTracker.instance = new TelemetryTracker();
    }
    return TelemetryTracker.instance;
  }

  // W3C Trace Context Helpers
  // Format: 00-{traceId}-{spanId}-{traceFlags}
  public parseTraceParent(traceParent?: string): Partial<TraceContext> | null {
    if (!traceParent) return null;
    const parts = traceParent.trim().split("-");
    if (parts.length < 4 || parts[0] !== "00") return null;
    return {
      traceId: parts[1],
      activeSpanId: parts[2]
    };
  }

  public formatTraceParent(context: TraceContext): string {
    return `00-${context.traceId}-${context.activeSpanId}-01`;
  }

  public parseBaggage(baggageHeader?: string): Record<string, string> {
    const baggage: Record<string, string> = {};
    if (!baggageHeader) return baggage;
    
    baggageHeader.split(",").forEach((item) => {
      const parts = item.split("=");
      if (parts.length === 2) {
        baggage[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    });
    return baggage;
  }

  public formatBaggage(baggage: Record<string, string>): string {
    return Object.entries(baggage)
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join(",");
  }

  public createTrace(traceId?: string, parentSpanId?: string, baggage?: Record<string, string>): TraceContext {
    const tid = traceId || crypto.randomBytes(16).toString("hex");
    const activeSpanId = parentSpanId || crypto.randomBytes(8).toString("hex");
    const traceBaggage = baggage || {};
    this.activeTraces.set(tid, []);
    this.baggageStores.set(tid, traceBaggage);
    return { traceId: tid, activeSpanId, baggage: traceBaggage };
  }

  public startSpan(
    traceId: string,
    name: string,
    parentSpanId?: string,
    attributes: Record<string, any> = {},
    links?: Array<{ traceId: string; spanId: string; attributes?: Record<string, any> }>
  ): string {
    const spanId = crypto.randomBytes(8).toString("hex");
    const currentBaggage = this.baggageStores.get(traceId) || {};
    
    const span: Span = {
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: {
        traceId,
        ...currentBaggage,
        ...attributes
      },
      links
    };

    const list = this.activeTraces.get(traceId) || [];
    list.push(span);
    this.activeTraces.set(traceId, list);

    // Invoke OTel platform hooks
    otelPlatform.onSpanStart(span);

    return spanId;
  }

  public endSpan(traceId: string, spanId: string, attributes?: Record<string, any>) {
    const list = this.activeTraces.get(traceId);
    if (!list) return;

    const span = list.find((s) => s.spanId === spanId);
    if (span) {
      span.endTime = Date.now();
      if (attributes) {
        span.attributes = { ...span.attributes, ...attributes };
      }
      
      const duration = span.endTime - span.startTime;
      span.attributes.durationMs = duration;

      // Invoke OTel platform hooks
      otelPlatform.onSpanEnd(span);
    }
  }

  public getTraceTree(traceId: string): Span[] {
    return this.activeTraces.get(traceId) || [];
  }

  public getAllActiveTraces(): Map<string, Span[]> {
    return this.activeTraces;
  }
}

export const telemetryTracker = TelemetryTracker.getInstance();
export default telemetryTracker;
