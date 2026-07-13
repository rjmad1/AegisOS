// src/infrastructure/observability/telemetry-platform.ts
// Swappable OpenTelemetry (OTLP) tracing platform hooks with local fallback

import { Span } from './telemetry';

export class OpenTelemetryPlatform {
  private active = false;
  private sdk: any = null;
  private tracer: any = null;

  constructor() {
    const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || '';
    if (otelEndpoint) {
      try {
        const req = eval('require');
        const { NodeSDK } = req('@opentelemetry/sdk-node');
        const { OTLPTraceExporter } = req('@opentelemetry/exporter-trace-otlp-http');
        const { SimpleSpanProcessor } = req('@opentelemetry/sdk-trace-base');
        const opentelemetry = req('@opentelemetry/api');

        // Configure OTLP Trace Exporter
        const traceExporter = new OTLPTraceExporter({
          url: `${otelEndpoint}/v1/traces`
        });

        this.sdk = new NodeSDK({
          traceExporter,
          spanProcessor: new SimpleSpanProcessor(traceExporter),
          serviceName: 'openclaw-ops-console'
        });

        // Start SDK
        this.sdk.start();
        this.tracer = opentelemetry.trace.getTracer('openclaw-core');
        this.active = true;
        console.log(`[OTelPlatform] Initialized OpenTelemetry SDK pointing to ${otelEndpoint}`);
      } catch (err: any) {
        console.warn(`[OTelPlatform] Failed to initialize OpenTelemetry SDK. Running in local fallback: ${err.message}`);
      }
    }
  }

  public isActive(): boolean {
    return this.active;
  }

  // Hook to propagate our custom spans to OTel if active
  public onSpanStart(span: Span): void {
    if (!this.active || !this.tracer) return;
    try {
      const parentContext = span.parentSpanId 
        ? { traceId: span.attributes.traceId, spanId: span.parentSpanId } 
        : undefined;

      // Start OTel span
      const otelSpan = this.tracer.startSpan(span.name, {
        startTime: span.startTime,
        attributes: {
          'span.id': span.spanId,
          ...span.attributes
        }
      }, parentContext);
      
      // Cache OTel span in attributes so we can retrieve and end it later
      span.attributes._otelSpan = otelSpan;
    } catch (err) {
      // Fail silently
    }
  }

  public onSpanEnd(span: Span): void {
    if (!this.active) return;
    try {
      const otelSpan = span.attributes._otelSpan;
      if (otelSpan) {
        if (span.attributes) {
          // Exclude internal pointer
          const { _otelSpan, ...cleanAttributes } = span.attributes;
          otelSpan.setAttributes(cleanAttributes);
        }
        otelSpan.end(span.endTime);
      }
    } catch (err) {
      // Fail silently
    }
  }

  public shutdown(): void {
    if (this.active && this.sdk) {
      this.sdk.shutdown()
        .then(() => console.log('[OTelPlatform] OpenTelemetry SDK terminated.'))
        .catch((err: any) => console.error('[OTelPlatform] Error shutting down:', err));
    }
  }
}

export const otelPlatform = new OpenTelemetryPlatform();
export default otelPlatform;
