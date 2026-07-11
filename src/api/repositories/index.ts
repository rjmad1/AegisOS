import { ApiResponse } from "@/api/types";

export interface IBaseApiRepository<T> {
  fetchAll(params?: Record<string, any>): Promise<ApiResponse<T[]>>;
  fetchById(id: string): Promise<ApiResponse<T>>;
  save(data: Partial<T>): Promise<ApiResponse<T>>;
  remove(id: string): Promise<ApiResponse<boolean>>;
}

export abstract class BaseApiRepository<T> implements IBaseApiRepository<T> {
  protected endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  abstract fetchAll(params?: Record<string, any>): Promise<ApiResponse<T[]>>;
  abstract fetchById(id: string): Promise<ApiResponse<T>>;
  abstract save(data: Partial<T>): Promise<ApiResponse<T>>;
  abstract remove(id: string): Promise<ApiResponse<boolean>>;
}
