// src/platform/ports/PortRegistry.ts
// Central registry manager to dynamically resolve ports from configs/ports.json

import * as fs from "fs";
import * as path from "path";

export interface ServicePortInfo {
  name: string;
  purpose: string;
  internal_port: number;
  default_host_port: number;
  protocol: string;
  health_endpoint: string | null;
  dependencies: string[];
  exposure: "private" | "public";
  reserved: boolean;
  dynamic: boolean;
  notes?: string;
}

export class PortRegistry {
  private static registry: Record<string, ServicePortInfo> | null = null;

  private static loadRegistry() {
    if (this.registry) return;
    try {
      // Resolve path relative to current workspace root
      const registryPath = path.resolve(process.cwd(), "configs/ports.json");
      if (fs.existsSync(registryPath)) {
        const content = fs.readFileSync(registryPath, "utf-8");
        this.registry = JSON.parse(content);
      } else {
        // Fallback static registry to prevent boot crashes if config file is missing
        this.registry = {
          console: { name: "console", purpose: "Console", internal_port: 3000, default_host_port: 3000, protocol: "HTTP", health_endpoint: "/api/health", dependencies: [], exposure: "private", reserved: true, dynamic: true },
          litellm: { name: "litellm", purpose: "LiteLLM", internal_port: 4000, default_host_port: 4000, protocol: "HTTP", health_endpoint: "/health/readiness", dependencies: [], exposure: "private", reserved: true, dynamic: true },
          ollama: { name: "ollama", purpose: "Ollama", internal_port: 11434, default_host_port: 11434, protocol: "HTTP", health_endpoint: "/api/tags", dependencies: [], exposure: "private", reserved: true, dynamic: true },
          postgres: { name: "postgres", purpose: "Postgres", internal_port: 5432, default_host_port: 5432, protocol: "TCP", health_endpoint: null, dependencies: [], exposure: "private", reserved: true, dynamic: true },
          redis: { name: "redis", purpose: "Redis", internal_port: 6379, default_host_port: 6379, protocol: "TCP", health_endpoint: null, dependencies: [], exposure: "private", reserved: true, dynamic: true },
          aegisos: { name: "aegisos", purpose: "AegisOS", internal_port: 18789, default_host_port: 18789, protocol: "HTTP", health_endpoint: null, dependencies: [], exposure: "private", reserved: true, dynamic: true },
          telemetry: { name: "telemetry", purpose: "Telemetry", internal_port: 3001, default_host_port: 3001, protocol: "WS", health_endpoint: null, dependencies: [], exposure: "private", reserved: true, dynamic: true }
        };
      }
    } catch (e) {
      console.error("[PortRegistry] Failed to load registry from file:", e);
      this.registry = {};
    }
  }

  public static get(serviceName: string): ServicePortInfo | undefined {
    this.loadRegistry();
    return this.registry?.[serviceName];
  }

  /** Clear cached registry so next access reloads from file. Test-only. */
  public static reset(): void {
    this.registry = null;
  }

  public static getHostPort(serviceName: string): number {
    const service = this.get(serviceName);
    if (!service) return 0;
    
    // Check environment variable overrides (e.g. HOST_PORT_LITELLM=14000)
    const envVarName = `HOST_PORT_${serviceName.toUpperCase()}`;
    if (process.env[envVarName]) {
      const parsed = parseInt(process.env[envVarName]!, 10);
      if (!isNaN(parsed)) return parsed;
    }
    
    // Check general PORT override for Next.js app
    if (serviceName === "console" && process.env.PORT) {
      const parsed = parseInt(process.env.PORT, 10);
      if (!isNaN(parsed)) return parsed;
    }

    return service.default_host_port;
  }

  public static getInternalPort(serviceName: string): number {
    const service = this.get(serviceName);
    return service ? service.internal_port : 0;
  }

  public static getServiceUrl(serviceName: string): string {
    const service = this.get(serviceName);
    if (!service) return "";
    
    const hostPort = this.getHostPort(serviceName);
    const protocol = service.protocol.toLowerCase() === "ws" ? "ws" : "http";
    return `${protocol}://127.0.0.1:${hostPort}`;
  }
}
