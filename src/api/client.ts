export interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(this.baseUrl + path, typeof window !== "undefined" ? window.location.origin : undefined);

    if (options.params) {
      Object.entries(options.params).forEach(([key, val]) => {
        url.searchParams.append(key, String(val));
      });
    }

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    // Interceptor: Inject Auth Token
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("ops_auth_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const mergedOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url.toString(), mergedOptions);

      // Interceptor: Handle Global Response Status
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { code: "SERVER_ERROR", message: "An unexpected error occurred" };
        }

        if (response.status === 401 && typeof window !== "undefined") {
          // Automatic logout on unauthorized intercept
          localStorage.removeItem("ops_auth_token");
          localStorage.removeItem("ops_user");
          window.location.href = "/login";
        }

        throw new ApiError(
          response.status,
          errorData.code || "API_ERROR",
          errorData.message || "Request failed",
          errorData.details
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "NETWORK_ERROR", error instanceof Error ? error.message : "Network request failed");
    }
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.request<T>(path, { method: "GET", params });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
