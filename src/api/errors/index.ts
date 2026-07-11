import { ApiError, ApiErrorDetail } from "@/api/client";

export class InfrastructureError extends ApiError {
  constructor(status: number, code: string, message: string, details?: ApiErrorDetail[]) {
    super(status, code, message, details);
    this.name = "InfrastructureError";
  }
}

export class VramAllocationError extends InfrastructureError {
  constructor(modelName: string, requiredBytes: number, availableBytes: number) {
    const detail: ApiErrorDetail = {
      code: "INSUFFICIENT_VRAM",
      message: `VRAM allocation failed for ${modelName}. Required: ${requiredBytes} bytes, Available: ${availableBytes} bytes`,
      field: "vram",
    };
    super(400, "VRAM_OVERFLOW", "Insufficient GPU VRAM available", [detail]);
    this.name = "VramAllocationError";
  }
}

export class ModelNotFoundError extends InfrastructureError {
  constructor(modelName: string) {
    super(404, "MODEL_NOT_FOUND", `The requested model weight '${modelName}' is not stored on this workstation.`);
    this.name = "ModelNotFoundError";
  }
}

export class ServiceUnavailableError extends InfrastructureError {
  constructor(serviceName: string, port: number) {
    super(503, "SERVICE_UNAVAILABLE", `The background service '${serviceName}' is unreachable on loopback port ${port}.`);
    this.name = "ServiceUnavailableError";
  }
}
