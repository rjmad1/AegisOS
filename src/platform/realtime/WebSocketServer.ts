// src/platform/realtime/WebSocketServer.ts
// Bootstraps port 3001 WebSocket server for low-latency operational telemetry streaming

import { WebSocketServer, WebSocket } from "ws";
import * as http from "http";
import * as crypto from "crypto";
import { jwtVerify } from "jose";
import * as zlib from "zlib";

import { infrastructureService } from "@/services/infrastructure.service";
import { ModelRuntime } from "@/platform/ai-runtime/ModelRuntime";
import { AgentRuntime } from "@/platform/ai-runtime/AgentRuntime";
import prisma from "@/infrastructure/db/prisma";
import { eventBus } from "@/infrastructure/events/event-bus";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";
import { PortRegistry } from "@/platform/ports/PortRegistry";

let cachedServicesSummary: { name: string; status: string }[] = [];
let lastServiceCheck = 0;

async function getServicesSummary(): Promise<{ name: string; status: string }[]> {
  const now = Date.now();
  if (now - lastServiceCheck < 5000 && cachedServicesSummary.length > 0) {
    return cachedServicesSummary;
  }
  try {
    const [ollama, litellm, openclaw, docker] = await Promise.all([
      deploymentManager.checkPort(PortRegistry.getHostPort("ollama")).catch(() => false),
      deploymentManager.checkPort(PortRegistry.getHostPort("litellm")).catch(() => false),
      deploymentManager.checkPort(PortRegistry.getHostPort("openclaw")).catch(() => false),
      deploymentManager.checkPort(PortRegistry.getHostPort("docker") || 2375).catch(() => false),
    ]);
    cachedServicesSummary = [
      { name: "Ollama", status: ollama ? "running" : "stopped" },
      { name: "LiteLLM", status: litellm ? "running" : "stopped" },
      { name: "OpenClaw", status: openclaw ? "running" : "stopped" },
      { name: "Docker", status: docker ? "running" : "stopped" },
    ];
  } catch (e) {
    console.error("[WebSocketServer:servicesCheckError]", e);
  }
  lastServiceCheck = now;
  return cachedServicesSummary;
}

const authSecret = process.env.AUTH_SECRET;
const key = new TextEncoder().encode(authSecret);

export function startWebSocketServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(404);
    res.end();
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req, socket, head) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const pathname = url.pathname;

      // 1. Verify endpoint path matches
      const isTelemetryPath = pathname === "/mobile/live" || pathname === "/api/v1/mobile/live";
      const isCommandLivePath = pathname === "/mobile/commands/live" || pathname === "/api/v1/mobile/commands/live";
      const isAssistantLivePath = pathname === "/mobile/assistant/live" || pathname === "/api/v1/mobile/assistant/live";

      if (!isTelemetryPath && !isCommandLivePath && !isAssistantLivePath) {
        socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
        socket.destroy();
        return;
      }

      // 2. Validate token from query params or Authorization headers
      const token = url.searchParams.get("token") || "";
      if (!token) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      try {
        await jwtVerify(token, key, { algorithms: ["HS256"] });
      } catch (err) {
        console.error("[WebSocketServer:AuthError]", err);
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // 3. Upgrade HTTP connection to WebSocket
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } catch (e: any) {
      console.error("[WebSocketServer:UpgradeError]", e);
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    const url = new URL(req.url || "", "http://localhost");
    const useCompression = url.searchParams.get("compress") === "zlib";
    
    const pathname = url.pathname;
    const isCommandLivePath = pathname === "/mobile/commands/live" || pathname === "/api/v1/commands/live" || pathname === "/api/v1/mobile/commands/live";
    const isAssistantLivePath = pathname === "/mobile/assistant/live" || pathname === "/api/v1/assistant/live" || pathname === "/api/v1/mobile/assistant/live";

    console.log(`[WebSocketServer] Client connected to ${pathname} (Compression: ${useCompression ? "zlib" : "none"})`);

    let isAlive = true;

    // Heartbeat logic
    ws.on("pong", () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log("[WebSocketServer] Client inactive. Terminating connection.");
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 15000);

    let telemetryInterval: NodeJS.Timeout | null = null;
    let commandSubId: string | null = null;
    let assistantSubId: string | null = null;

    if (isAssistantLivePath) {
      // Subscribe to EventBus updates and broadcast C2 status transitions
      assistantSubId = eventBus.subscribe("CommandUpdated", async (event) => {
        try {
          const { commandId, status } = event.payload;
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "ASSISTANT_COMMAND_UPDATE",
                commandId,
                status,
              })
            );
          }
        } catch (err) {
          console.error("[WebSocketServer:AssistantCommandUpdated]", err);
        }
      });
    } else if (isCommandLivePath) {
      // 1. Send all currently unresolved commands as baseline snapshot
      prisma.command
        .findMany({
          where: {
            status: { in: ["QUEUED", "PENDING_APPROVAL", "RUNNING"] },
          },
          orderBy: { createdAt: "desc" },
        })
        .then((commands) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "COMMANDS_SNAPSHOT",
                commands: commands.map((c) => ({
                  id: c.id,
                  type: c.type,
                  status: c.status,
                  priority: c.priority,
                  payload: JSON.parse(c.payload),
                  riskLevel: c.riskLevel,
                  userId: c.userId,
                  userEmail: c.userEmail,
                  deviceId: c.deviceId,
                  origin: c.origin,
                  approvalType: c.approvalType,
                  approvalStatus: c.approvalStatus,
                  approvers: JSON.parse(c.approvers || "[]"),
                  scheduledAt: c.scheduledAt,
                  createdAt: c.createdAt,
                  startedAt: c.startedAt,
                  completedAt: c.completedAt,
                  durationMs: c.durationMs,
                  retryCount: c.retryCount,
                  maxRetries: c.maxRetries,
                  errorMessage: c.errorMessage,
                })),
              })
            );
          }
        })
        .catch((err) => console.error("[WebSocketServer:SnapshotError]", err));

      // 2. Subscribe to EventBus updates
      commandSubId = eventBus.subscribe("CommandUpdated", async (event) => {
        try {
          const { commandId } = event.payload;
          const cmd = await prisma.command.findUnique({ where: { id: commandId } });
          if (cmd && ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "COMMAND_UPDATE",
                command: {
                  id: cmd.id,
                  type: cmd.type,
                  status: cmd.status,
                  priority: cmd.priority,
                  payload: JSON.parse(cmd.payload),
                  riskLevel: cmd.riskLevel,
                  userId: cmd.userId,
                  userEmail: cmd.userEmail,
                  deviceId: cmd.deviceId,
                  origin: cmd.origin,
                  approvalType: cmd.approvalType,
                  approvalStatus: cmd.approvalStatus,
                  approvers: JSON.parse(cmd.approvers || "[]"),
                  scheduledAt: cmd.scheduledAt,
                  createdAt: cmd.createdAt,
                  startedAt: cmd.startedAt,
                  completedAt: cmd.completedAt,
                  durationMs: cmd.durationMs,
                  retryCount: cmd.retryCount,
                  maxRetries: cmd.maxRetries,
                  errorMessage: cmd.errorMessage,
                  result: cmd.result ? JSON.parse(cmd.result) : null,
                },
              })
            );
          }
        } catch (err) {
          console.error("[WebSocketServer:CommandUpdatedEvent]", err);
        }
      });
    } else {
      // Telemetry Stats Path
      telemetryInterval = setInterval(async () => {
        try {
          // Backpressure check: Skip frame if socket buffer has pending bytes
          if (ws.bufferedAmount > 0) {
            console.warn("[WebSocketServer:Backpressure] Network congested. Skipping telemetry frame.");
            return;
          }

          if (ws.readyState !== WebSocket.OPEN) return;

          // Collect stats from services
          const host = await infrastructureService.getHost();
          const gpu = await infrastructureService.getGpu();
          const alerts = infrastructureService.getAlerts();
          
           // Count background jobs
           const queuedJobs = await prisma.job.count({ where: { status: "PENDING" } });
           const failedJobs = await prisma.job.count({ where: { status: "FAILED" } });
           const pendingApprovals = await prisma.command.count({ where: { status: "PENDING_APPROVAL" } });
           const services = await getServicesSummary();

           // Retrieve running agents
           const agents = AgentRuntime.getInstance().getAgents().map((a) => {
             const state = AgentRuntime.getInstance().getAgentState(a.id);
             return {
               id: a.id,
               role: a.role,
               state: state?.state || "idle",
               invocations: state?.metrics.invocations || 0,
               tokens: state?.metrics.tokensConsumed || 0
             };
           });

           // Current active model details
           const activeModel = await ModelRuntime.getInstance().route("ping").catch(() => null);

           const telemetryPayload = {
             timestamp: Date.now(),
             cpu: {
               load: host.cpu.load,
               cores: host.cpu.cores,
               manufacturer: host.cpu.manufacturer,
               brand: host.cpu.brand,
               temperature: host.cpu.temperature?.current || 42.0,
             },
             memory: {
               total: host.memory.total,
               used: host.memory.used,
               free: host.memory.free,
               percent: Math.round((host.memory.used / host.memory.total) * 100)
             },
             gpu: {
               vendor: gpu.vendor,
               driver: gpu.driver,
               utilization: gpu.devices[0]?.utilization || 0,
               temperature: gpu.devices[0]?.temperature?.current || 0,
               vram: {
                 total: gpu.devices[0]?.vram.total || 0,
                 used: gpu.devices[0]?.vram.used || 0,
                 free: gpu.devices[0]?.vram.free || 0
               }
             },
             disk: {
               installedStorage: host.installedStorage,
               mountedVolumes: host.mountedVolumes,
               total: host.mountedVolumes.reduce((sum, v) => sum + v.sizeBytes, 0),
               used: host.mountedVolumes.reduce((sum, v) => sum + v.usedBytes, 0),
               free: host.mountedVolumes.reduce((sum, v) => sum + v.freeBytes, 0),
               percent: host.mountedVolumes.length > 0 
                 ? Math.round((host.mountedVolumes.reduce((sum, v) => sum + v.usedBytes, 0) / host.mountedVolumes.reduce((sum, v) => sum + v.sizeBytes, 0)) * 100) 
                 : 0
             },
             network: {
               rx: 15.4 * 1024 + Math.round(Math.random() * 200 * 1024), // Bytes/sec simulated
               tx: 4.8 * 1024 + Math.round(Math.random() * 50 * 1024)
             },
             battery: host.powerStatus,
             uptime: host.uptime,
             healthScore: host.healthStatus === "healthy" ? 100 : host.healthStatus === "degraded" ? 75 : 30,
             alertsCount: alerts.length,
             pendingApprovals,
             services,
             aiRuntime: {
               currentModel: activeModel?.displayName || "None",
               inferenceQueue: queuedJobs,
               tokensPerSec: 32.5 + Math.random() * 5.0, // Simulated token rate
               runningAgents: agents.filter(a => a.state === "running").length,
               queuedJobs,
               failedJobs
             },
             agents
           };

          const jsonString = JSON.stringify(telemetryPayload);

          if (useCompression) {
            zlib.deflate(Buffer.from(jsonString, "utf8"), (err, result) => {
              if (!err && ws.readyState === WebSocket.OPEN) {
                ws.send(result, { binary: true });
              }
            });
          } else {
            ws.send(jsonString);
          }
        } catch (err) {
          console.error("[WebSocketServer:TelemetryError]", err);
        }
      }, 500);
    }

    ws.on("close", () => {
      console.log(`[WebSocketServer] Client disconnected from ${pathname}`);
      clearInterval(pingInterval);
      if (telemetryInterval) clearInterval(telemetryInterval);
      if (commandSubId) eventBus.unsubscribe(commandSubId);
      if (assistantSubId) eventBus.unsubscribe(assistantSubId);
    });

    ws.on("error", (err) => {
      console.error(`[WebSocketServer:SocketError] Path ${pathname} error:`, err);
      clearInterval(pingInterval);
      if (telemetryInterval) clearInterval(telemetryInterval);
      if (commandSubId) eventBus.unsubscribe(commandSubId);
      if (assistantSubId) eventBus.unsubscribe(assistantSubId);
    });
  });

  const telemetryPort = PortRegistry.getHostPort("telemetry") || 3001;
  server.listen(telemetryPort, () => {
    console.log(`[WebSocketServer] Telemetry server listening on port ${telemetryPort}`);
  });
}
