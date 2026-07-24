// src/infrastructure/contracts/http-client.ts
// Decoupled HTTP Client Contract for AegisOS Platform Infrastructure

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  timeoutMs?: number;
  retries?: number;
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  ok: boolean;
}

export interface IHttpClient {
  get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  post<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  put<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  patch<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
  delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
}
