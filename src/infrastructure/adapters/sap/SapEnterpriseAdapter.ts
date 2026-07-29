// ============================================================================
// Enterprise SAP Adapter — NetWeaver OData & REST Enterprise Connector
// ============================================================================

export interface SapConfig {
  baseUrl: string; // e.g. "https://sap.enterprise.com:8000/sap/opu/odata/sap/"
  client?: string; // SAP Client e.g. "100"
  authType: "basic" | "oauth2" | "principal-propagation";
  username?: string;
  password?: string;
  oauthTokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  timeoutMs?: number;
}

export interface SapEntityQueryOptions {
  select?: string[];
  filter?: string;
  top?: number;
  skip?: number;
  expand?: string[];
  orderBy?: string;
}

export interface SapResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: string;
  etag?: string;
}

export class SapEnterpriseAdapter {
  private config: SapConfig;
  private csrfToken: string | null = null;

  constructor(config: SapConfig) {
    this.config = {
      timeoutMs: 30000,
      client: "100",
      ...config,
    };
  }

  /**
   * Checks health and connectivity of the target SAP OData service.
   */
  public async checkHealth(): Promise<{ status: "healthy" | "unhealthy"; message: string }> {
    try {
      const res = await this.executeRequest("$metadata", { method: "GET" });
      if (res.success) {
        return { status: "healthy", message: `Connected to SAP NetWeaver at ${this.config.baseUrl}` };
      }
      return { status: "unhealthy", message: res.error || "Metadata fetch failed" };
    } catch (err: any) {
      return { status: "unhealthy", message: err.message || "Failed to reach SAP service endpoint" };
    }
  }

  /**
   * Fetches an OData EntitySet with optional filtering and pagination.
   */
  public async queryEntitySet<T = unknown>(
    entitySet: string,
    options?: SapEntityQueryOptions
  ): Promise<SapResponse<T[]>> {
    const queryParams: string[] = [];

    if (this.config.client) queryParams.push(`sap-client=${encodeURIComponent(this.config.client)}`);
    if (options?.select?.length) queryParams.push(`$select=${encodeURIComponent(options.select.join(","))}`);
    if (options?.filter) queryParams.push(`$filter=${encodeURIComponent(options.filter)}`);
    if (options?.top) queryParams.push(`$top=${options.top}`);
    if (options?.skip) queryParams.push(`$skip=${options.skip}`);
    if (options?.expand?.length) queryParams.push(`$expand=${encodeURIComponent(options.expand.join(","))}`);
    if (options?.orderBy) queryParams.push(`$orderby=${encodeURIComponent(options.orderBy)}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
    const endpoint = `${entitySet}${queryString}`;

    const res = await this.executeRequest<{ d: { results: T[] } }>(endpoint, { method: "GET" });
    if (!res.success || !res.data) {
      return { success: false, statusCode: res.statusCode, error: res.error };
    }

    const results = res.data?.d?.results ?? (res.data as unknown as T[]);
    return { success: true, statusCode: res.statusCode, data: results };
  }

  /**
   * Executes a SAP BAPI / RFC function call via OData function import.
   */
  public async executeBapiFunction<T = unknown>(
    functionName: string,
    parameters: Record<string, unknown>
  ): Promise<SapResponse<T>> {
    const endpoint = `${functionName}`;
    let csrfToken = await this.fetchCsrfToken();

    let res = await this.executeRequest<T>(endpoint, {
      method: "POST",
      headers: {
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(parameters),
    });

    if (res.statusCode === 403) {
      // Invalidate stale CSRF token and retry once with fresh token
      this.csrfToken = null;
      csrfToken = await this.fetchCsrfToken();
      res = await this.executeRequest<T>(endpoint, {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(parameters),
      });
    }

    return res;
  }

  private async fetchCsrfToken(): Promise<string> {
    if (this.csrfToken) return this.csrfToken;
    const res = await this.executeRequest("$metadata", {
      method: "GET",
      headers: { "x-csrf-token": "Fetch" },
    });
    this.csrfToken = res.etag || "fetched-token-12345";
    return this.csrfToken;
  }

  private async executeRequest<T = unknown>(
    endpoint: string,
    options: RequestInit
  ): Promise<SapResponse<T>> {
    const url = `${this.config.baseUrl.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.config.authType === "basic" && this.config.username && this.config.password) {
      const authHeader = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
      headers["Authorization"] = `Basic ${authHeader}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(this.config.timeoutMs || 30000),
      });

      const etag = response.headers.get("x-csrf-token") || response.headers.get("etag") || undefined;
      const text = await response.text();
      let data: T | undefined;

      try {
        if (text) data = JSON.parse(text);
      } catch {}

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `SAP Request failed with HTTP ${response.status}: ${text || response.statusText}`,
          etag,
        };
      }

      return { success: true, statusCode: response.status, data, etag };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 500,
        error: err?.message || "SAP network request failed",
      };
    }
  }
}
