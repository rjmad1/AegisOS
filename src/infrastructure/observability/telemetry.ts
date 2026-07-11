import * as crypto from "crypto";

export interface Span {
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes: Record<string, any>;
}

export interface TraceContext {
  traceId: string;
  activeSpanId: string;
}

export class TelemetryTracker {
  private static instance: TelemetryTracker | null = null;
  private activeTraces: Map<string, Span[]> = new Map();

  private constructor() {}

  public static getInstance(): TelemetryTracker {
    if (!TelemetryTracker.instance) {
      TelemetryTracker.instance = new TelemetryTracker();
    }
    return TelemetryTracker.instance;
  }

  public createTrace(traceId?: string): TraceContext {
    const tid = traceId || "trace-" + crypto.randomBytes(8).toString("hex");
    const activeSpanId = "span-" + crypto.randomBytes(4).toString("hex");
    this.activeTraces.set(tid, []);
    return { traceId: tid, activeSpanId };
  }

  public startSpan(traceId: string, name: string, parentSpanId?: string): string {
    const spanId = "span-" + crypto.randomBytes(4).toString("hex");
    const span: Span = {
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      attributes: {}
    };

    const list = this.activeTraces.get(traceId) || [];
    list.push(span);
    this.activeTraces.set(traceId, list);

    console.log(`[Telemetry:SpanStart] Trace: ${traceId} | Span: ${spanId} | Name: ${name}`);
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
      console.log(`[Telemetry:SpanEnd] Span: ${spanId} | Name: ${span.name} | Duration: ${duration}ms`);
    }
  }

  public getTraceTree(traceId: string): Span[] {
    return this.activeTraces.get(traceId) || [];
  }
}

export const telemetryTracker = TelemetryTracker.getInstance();
export default telemetryTracker;
