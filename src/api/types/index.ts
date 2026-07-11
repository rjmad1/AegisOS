export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

export type ConnectionStatus = "connected" | "disconnected" | "connecting" | "error";

export interface HostMetrics {
  cpuUsage: number;
  memoryUsage: number;
  vramUsage: number;
  uptime: number;
}

export * from "./background-processing";
export * from "./events";
export * from "./search";
export * from "./notifications";
export * from "./plugins";

