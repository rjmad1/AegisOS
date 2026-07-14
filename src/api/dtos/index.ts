export interface LoadModelRequestDto {
  modelName: string;
  quantization?: string;
  vramRatio?: number; // 0 to 1
}

export interface LoadModelResponseDto {
  modelName: string;
  status: "loaded" | "loading" | "error";
  allocatedVram: number; // in bytes
  port: number;
}

export interface IngestDocumentRequestDto {
  fileName: string;
  filePath: string;
  targetIndex: string;
  chunkSize?: number;
}

export interface TriggerWorkflowRequestDto {
  workflowId: string;
  agentId: string;
  inputParams: Record<string, any>;
}

export interface UpdateSettingsDto {
  ollamaUrl?: string;
  litellmUrl?: string;
  aegisosUrl?: string;
  telemetryInterval?: number;
}
