import { NextResponse } from "next/server";
import { deploymentManager } from "@/infrastructure/sdk/platform-sdk";
import * as fs from "fs";
import * as path from "path";
import { PortRegistry } from "@/platform/ports/PortRegistry";

export async function GET() {
  const dbDir = process.env.OPS_DATABASES_DIR || path.resolve(process.cwd(), "databases");
  
  // 1. Verify filesystem write accessibility
  let fsWritable = false;
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const testFile = path.join(dbDir, ".ready_write_test");
    fs.writeFileSync(testFile, "test", "utf-8");
    fs.unlinkSync(testFile);
    fsWritable = true;
  } catch (err) {
    console.error("[Readiness Check] Filesystem check failed:", err);
  }

  // 2. Verify downstream dependencies (ports check)
  const isOllamaRunning = await deploymentManager.checkPort(PortRegistry.getHostPort("ollama"));
  const isLiteLLMRunning = await deploymentManager.checkPort(PortRegistry.getHostPort("litellm"));
  const isAegisOSRunning = await deploymentManager.checkPort(PortRegistry.getHostPort("aegisos"));

  const ready = fsWritable && isOllamaRunning && isLiteLLMRunning && isAegisOSRunning;

  const payload = {
    ready,
    checks: {
      databasesDirectoryWritable: fsWritable,
      ollamaService: isOllamaRunning,
      liteLLMService: isLiteLLMRunning,
      aegisOSService: isAegisOSRunning
    },
    timestamp: new Date().toISOString()
  };

  if (!ready) {
    return NextResponse.json(payload, { status: 503 });
  }

  return NextResponse.json(payload);
}
