import { ApiError } from "@/api/client";

export function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  
  const queryParts = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    
  return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
}

export function isInfrastructureError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function parseRetryAfterHeader(headers: Headers): number {
  const retryAfter = headers.get("Retry-After");
  if (!retryAfter) return 0;
  
  const seconds = parseInt(retryAfter, 10);
  if (!isNaN(seconds)) return seconds * 1000;
  
  const date = Date.parse(retryAfter);
  if (!isNaN(date)) return Math.max(0, date - Date.now());
  
  return 0;
}
