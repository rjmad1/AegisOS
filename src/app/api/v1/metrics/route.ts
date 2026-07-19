// src/app/api/v1/metrics/route.ts
// Exposes Prometheus-compatible text metrics for CPU, memory, GPU, and AI model inference parameters.

import { metricsPlatform } from "@/infrastructure/sdk/platform-sdk";

export async function GET() {
  const prometheusText = metricsPlatform.toPrometheusFormat();

  return new Response(prometheusText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
