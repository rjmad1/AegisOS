export interface ConsoleConfig {
  ollamaBaseUrl: string;
  liteLlmBaseUrl: string;
  openClawBaseUrl: string;
  defaultRefreshInterval: number;
  apiTimeout: number;
  enableTelemetry: boolean;
}

export const DEFAULT_CONFIG: ConsoleConfig = {
  ollamaBaseUrl: process.env.NEXT_PUBLIC_OLLAMA_URL || "http://127.0.0.1:11434",
  liteLlmBaseUrl: process.env.NEXT_PUBLIC_LITELLM_URL || "http://127.0.0.1:4000",
  openClawBaseUrl: process.env.NEXT_PUBLIC_OPENCLAW_URL || "http://127.0.0.1:18789",
  defaultRefreshInterval: 5000, // 5 seconds
  apiTimeout: 30000, // 30 seconds
  enableTelemetry: false, // Strict local environment
};

export const API_ENDPOINTS = {
  models: {
    list: "/models/list",
    load: "/models/load",
    unload: "/models/unload",
    metrics: "/models/metrics",
  },
  agents: {
    list: "/agents",
    trigger: "/agents/trigger",
  },
  artifacts: {
    list: "/artifacts",
    get: (id: string) => `/artifacts/${id}`,
    download: (id: string) => `/artifacts/${id}/download`,
  },
  hardware: {
    metrics: "/hardware/metrics",
    storage: "/hardware/storage",
  },
};
