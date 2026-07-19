// src/infrastructure/daemon/infrastructure-daemon.ts
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const LOG_FILE = path.resolve(process.cwd(), "databases", "infrastructure-daemon.log");
const PID_FILE = path.resolve(process.cwd(), "databases", "infrastructure-daemon.pid");

function log(msg: string) {
  const timestamp = new Date().toISOString();
  const formatted = `[${timestamp}] [DAEMON] ${msg}\n`;
  console.log(formatted.trim());
  try {
    fs.appendFileSync(LOG_FILE, formatted);
  } catch (err) {
    console.error("Failed to write to daemon log file:", err);
  }
}

// Ensure database directory exists
const dbDir = path.dirname(LOG_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

fs.writeFileSync(PID_FILE, process.pid.toString());
log(`Daemon process started with PID ${process.pid}`);

let nextJsProcess: ChildProcess | null = null;
let isStopping = false;

function spawnNextJs() {
  if (isStopping) return;

  log("Spawning Next.js application server process...");
  const isWin = os.platform() === "win32";
  const npmCmd = isWin ? "npm.cmd" : "npm";
  
  nextJsProcess = spawn(npmCmd, ["run", "dev"], {
    cwd: process.cwd(),
    env: { ...process.env, BYPASS_ELEVATION: "true" },
    shell: true,
  });

  nextJsProcess.stdout?.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        log(`[Next.js stdout] ${line.trim()}`);
      }
    }
  });

  nextJsProcess.stderr?.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) {
        log(`[Next.js stderr] ${line.trim()}`);
      }
    }
  });

  nextJsProcess.on("close", (code) => {
    log(`Next.js process exited with code ${code}`);
    nextJsProcess = null;
    if (!isStopping) {
      log("Restarting Next.js process in 5 seconds...");
      setTimeout(spawnNextJs, 5000);
    }
  });
}

// Bootstrap Next.js
spawnNextJs();

// Trigger initial platform startup after Next.js has had some time to bind
setTimeout(async () => {
  log("Triggering platform startup orchestration sequence...");
  try {
    const response = await fetch("http://127.0.0.1:20128/api/v1/control-plane", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: "start platform" }),
    });
    const result = await response.json();
    log(`Bootstrap orchestration response: ${JSON.stringify(result)}`);
  } catch (err: any) {
    log(`Failed to trigger initial bootstrap command: ${err.message}`);
  }
}, 15000);

// Graceful shutdown handling
function handleShutdown(signal: string) {
  if (isStopping) return;
  isStopping = true;
  log(`Received ${signal} signal. Beginning shutdown sequence...`);

  // Try triggering safe platform shutdown command
  fetch("http://127.0.0.1:20128/api/v1/control-plane", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command: "stop platform" }),
  })
    .then(async (res) => {
      const data = await res.json();
      log(`Shutdown control plane response: ${JSON.stringify(data)}`);
    })
    .catch((err) => {
      log(`Error calling shutdown command: ${err.message}`);
    })
    .finally(() => {
      if (nextJsProcess) {
        log("Killing Next.js child process...");
        nextJsProcess.kill("SIGTERM");
      }
      try {
        if (fs.existsSync(PID_FILE)) {
          fs.unlinkSync(PID_FILE);
        }
      } catch {}
      log("Daemon shutdown complete.");
      process.exit(0);
    });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGHUP", () => handleShutdown("SIGHUP"));
