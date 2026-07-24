// src/infrastructure/factories/http-client-factory.ts
// Factory for creating isolated IHttpClient instances

import { IHttpClient } from "../contracts/http-client";
import { FetchHttpClientAdapter } from "../adapters/fetch-http-client";

export class HttpClientFactory {
  private static defaultInstance: IHttpClient;

  public static createClient(timeoutMs: number = 10000): IHttpClient {
    return new FetchHttpClientAdapter(timeoutMs);
  }

  public static getDefaultClient(): IHttpClient {
    if (!HttpClientFactory.defaultInstance) {
      HttpClientFactory.defaultInstance = new FetchHttpClientAdapter();
    }
    return HttpClientFactory.defaultInstance;
  }
}
