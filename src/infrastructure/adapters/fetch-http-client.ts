// src/infrastructure/adapters/fetch-http-client.ts
// Standard Fetch Implementation of IHttpClient with Timeout & Retry Resiliency

import { IHttpClient, HttpRequestOptions, HttpResponse } from "../contracts/http-client";

export class FetchHttpClientAdapter implements IHttpClient {
  private defaultTimeoutMs: number;

  constructor(defaultTimeoutMs: number = 10000) {
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("GET", url, undefined, options);
  }

  async post<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("POST", url, body, options);
  }

  async put<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PUT", url, body, options);
  }

  async patch<T = any>(url: string, body?: any, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", url, body, options);
  }

  async delete<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", url, undefined, options);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: any,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const maxRetries = options?.retries !== undefined ? options.retries : 2;

    let targetUrl = url;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          searchParams.append(k, String(v));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        targetUrl += (targetUrl.includes("?") ? "&" : "?") + queryString;
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    };

    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt <= maxRetries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const init: RequestInit = {
          method,
          headers,
          signal: options?.signal || controller.signal,
        };

        if (body !== undefined) {
          init.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        const response = await fetch(targetUrl, init);
        clearTimeout(timer);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
          responseHeaders[key] = val;
        });

        let data: any;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        return {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          data,
          ok: response.ok,
        };
      } catch (err: any) {
        clearTimeout(timer);
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          // Exponential backoff delay
          await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 100));
        }
      }
    }

    throw lastError || new Error(`HttpRequest failed after ${maxRetries} retries.`);
  }
}
