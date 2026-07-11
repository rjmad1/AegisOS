import { ApiResponse, HostMetrics } from "@/api/types";
import { LoadModelRequestDto, LoadModelResponseDto, UpdateSettingsDto } from "@/api/dtos";

export interface IModelApiService {
  getServedModels(): Promise<ApiResponse<string[]>>;
  loadModel(dto: LoadModelRequestDto): Promise<ApiResponse<LoadModelResponseDto>>;
  unloadModel(modelName: string): Promise<ApiResponse<boolean>>;
}

export interface IHardwareApiService {
  getHostMetrics(): Promise<ApiResponse<HostMetrics>>;
}

export interface ISettingsApiService {
  updateSettings(dto: UpdateSettingsDto): Promise<ApiResponse<boolean>>;
}
