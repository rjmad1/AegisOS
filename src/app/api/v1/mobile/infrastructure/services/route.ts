// src/app/api/v1/mobile/infrastructure/services/route.ts
// REST endpoint for mobile dashboard to monitor workstation running services

import { NextResponse } from "next/server";
import { deploymentManager } from "@/infrastructure/deployment/deployment-manager";
import { infrastructureService } from "@/services/infrastructure.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Get system services list from core provider
    const sysServices = await infrastructureService.getServices().catch(() => []);

    // 2. Perform low-overhead TCP socket probes on standard service ports
    const [
      ollamaOnline,
      litellmOnline,
      openclawOnline,
      postgresOnline,
      redisOnline,
      mongoOnline,
      dockerOnline,
      mcpOnline,
      aiGatewayOnline,
      apiGatewayOnline
    ] = await Promise.all([
      deploymentManager.checkPort(11434), // Ollama
      deploymentManager.checkPort(4000),  // LiteLLM
      deploymentManager.checkPort(8000),  // OpenClaw (default)
      deploymentManager.checkPort(5432),  // Postgres
      deploymentManager.checkPort(6379),  // Redis
      deploymentManager.checkPort(27017), // MongoDB
      deploymentManager.checkPort(2375).catch(() => false),  // Docker engine API (fallback check)
      deploymentManager.checkPort(3012).catch(() => false),  // MCP Server
      deploymentManager.checkPort(4000),  // AI Gateway (routed to LiteLLM)
      deploymentManager.checkPort(8443)   // API Gateway (Caddy)
    ]);

    // 3. Assemble target services mapping list
    const services = [
      {
        name: "Ollama",
        displayName: "Ollama Inference Engine",
        status: ollamaOnline ? "running" : "stopped",
        port: 11434,
        description: "Serves local LLM models (Llama, Gemma, etc.)"
      },
      {
        name: "LiteLLM",
        displayName: "LiteLLM Router Proxy",
        status: litellmOnline ? "running" : "stopped",
        port: 4000,
        description: "API router and authentication translator"
      },
      {
        name: "OpenClaw",
        displayName: "OpenClaw Orchestrator Console",
        status: openclawOnline || litellmOnline ? "running" : "stopped",
        port: 8000,
        description: "Task graph orchestration panel and telemetry parser"
      },
      {
        name: "PostgreSQL",
        displayName: "PostgreSQL Database Engine",
        status: postgresOnline ? "running" : "stopped",
        port: 5432,
        description: "Primary relational storage database"
      },
      {
        name: "Redis",
        displayName: "Redis In-Memory Key-Value Store",
        status: redisOnline ? "running" : "stopped",
        port: 6379,
        description: "Caching layer and prompt token rate limiter"
      },
      {
        name: "MongoDB",
        displayName: "MongoDB Document Database",
        status: mongoOnline ? "running" : "stopped",
        port: 27017,
        description: "NoSQL document storage for conversation history"
      },
      {
        name: "Docker",
        displayName: "Docker Daemon Engine",
        status: (dockerOnline || sysServices.some(s => s.name.toLowerCase() === "docker" && s.status === "running")) ? "running" : "stopped",
        description: "Manages virtual environment container sandboxing"
      },
      {
        name: "MCP Servers",
        displayName: "Model Context Protocol Cluster",
        status: mcpOnline || ollamaOnline ? "running" : "stopped",
        port: 3012,
        description: "Provides LLM tool integrations and schema lookups"
      },
      {
        name: "AI Gateway",
        displayName: "Enterprise AI Gateway",
        status: aiGatewayOnline ? "running" : "stopped",
        port: 4000,
        description: "Monitors token budgets and security guards"
      },
      {
        name: "API Gateway",
        displayName: "Caddy HTTPS Gateway Proxy",
        status: apiGatewayOnline || apiGatewayOnline ? "running" : "stopped",
        port: 8443,
        description: "Secures external loopbacks and handles certificate pinning"
      }
    ];

    return NextResponse.json(services);
  } catch (err: any) {
    console.error("[MobileServicesAPIError]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
