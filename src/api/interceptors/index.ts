import { ApiError } from "@/api/client";

export type RequestInterceptor = (request: RequestInit) => RequestInit | Promise<RequestInit>;
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
export type ErrorInterceptor = (error: ApiError) => void | Promise<void>;

export class InterceptorChain {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  addRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  addErrorInterceptor(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  async runRequestInterceptors(request: RequestInit): Promise<RequestInit> {
    let currentRequest = { ...request };
    for (const interceptor of this.requestInterceptors) {
      currentRequest = await interceptor(currentRequest);
    }
    return currentRequest;
  }

  async runResponseInterceptors(response: Response): Promise<Response> {
    let currentResponse = response;
    for (const interceptor of this.responseInterceptors) {
      currentResponse = await interceptor(currentResponse);
    }
    return currentResponse;
  }

  async runErrorInterceptors(error: ApiError): Promise<void> {
    for (const interceptor of this.errorInterceptors) {
      await interceptor(error);
    }
  }
}

export const interceptorChain = new InterceptorChain();

// Default Logger Interceptor
interceptorChain.addRequestInterceptor((req) => {
  console.log(`[API Request] Dispatching request at: ${new Date().toISOString()}`);
  return req;
});

interceptorChain.addErrorInterceptor((err) => {
  console.error(`[API Error] Code: ${err.code}, Status: ${err.status}, Message: ${err.message}`);
});
