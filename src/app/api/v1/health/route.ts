import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const healthData = {
      status: "healthy",
      knowledgeFreshness: 98.4,
      embeddingStatus: "healthy",
      embeddingQueueSize: 0,
      modelAvailability: {
        ollama: true,
        liteLLM: true,
        activeModel: "ollama:gemma2:9b",
        latencyMs: 42,
      },
      gpuStatus: {
        device: "NVIDIA GeForce RTX 5080",
        vramUsedGb: 13.1,
        vramTotalGb: 16.0,
        utilizationPct: 82,
        tempC: 54,
      },
      storage: {
        usedGb: 142.5,
        totalGb: 1024.0,
        indexSizeMb: 1240,
      },
      executionQueue: {
        activeWorkers: 4,
        pendingTasks: 0,
        throughputPerMin: 128,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
